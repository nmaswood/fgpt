import abc
from typing import NamedTuple
from loguru import logger

import pandas as pd
from springtime.services.sheet_processor import SheetPreprocessorImpl
from springtime.services.token import TokenLengthResponse, get_token_length

import openai
from pydantic import BaseModel
from springtime.models.open_ai import CompletionResponse


from springtime.services.prompts import EXCEL_SYSTEM_CONTEXT


class AnalyzeArguments(BaseModel):
    excel_file: pd.ExcelFile

    class Config:
        arbitrary_types_allowed = True


class AnalyzeResponseChunk(BaseModel):
    content: str
    prompt: str
    sheet_names: list[str]


class InputChunk(BaseModel):
    prompt: str
    sheet_names: list[str]


class _PreprocessedSheet(NamedTuple):
    sheet_name: str
    token_length: TokenLengthResponse
    parsed_sheet: dict[str, pd.DataFrame]
    sheet_as_string: str


class AnalyzeResponse(BaseModel):
    chunks: list[AnalyzeResponseChunk]


class TableAnalyzer(abc.ABC):
    @abc.abstractmethod
    def analyze(self, *, excel_file: pd.ExcelFile) -> AnalyzeResponse:
        return None


GPT4_TOKEN_LIMIT = 5000


class TableAnalyzerImpl(TableAnalyzer):
    def __init__(self):
        self._preprocessor = self.openai_preprocess()

    @staticmethod
    def openai_preprocess():
        def get_length(text: str) -> int:
            return get_token_length(text).gpt4

        return SheetPreprocessorImpl(get_length, GPT4_TOKEN_LIMIT)

    def analyze(self, *, excel_file: pd.ExcelFile) -> AnalyzeResponse:
        acc: list[AnalyzeResponseChunk] = []

        xl = pd.ExcelFile(excel_file)
        preprocessed = self._preprocessor.preprocess(xl=xl)
        chunks = self._preprocessor.chunk(preprocessed)

        logger.info(f"{len(chunks)} Chunks being analyzed")
        for sheet_chunk in chunks.sheets:
            table_content = "\n".join([sheet.sheet_as_string for sheet in sheet_chunk])
            resp = self._chat_completion(table_content)

            acc.append(
                AnalyzeResponseChunk(
                    sheet_names=[sheet.sheet_name for sheet in sheet_chunk],
                    content=resp.choices[0].message.content,
                    prompt=table_content,
                )
            )

            sheet_names = ", ".join([sheet.sheet_name for sheet in sheet_chunk])
            logger.info(f"Finished analyzing sheet chunk: {sheet_names}")

        return AnalyzeResponse(chunks=acc)

    def _chat_completion(self, table: str) -> CompletionResponse:
        completion = openai.ChatCompletion.create(
            model="gpt-4-0613",
            messages=[
                {
                    "role": "system",
                    "content": EXCEL_SYSTEM_CONTEXT,
                },
                {"role": "user", "content": table},
            ],
            temperature=0,
        )
        return CompletionResponse(**completion)
