import abc
from typing import NamedTuple
from loguru import logger

import pandas as pd
from springtime.routers.token_length_service import TokenLengthService
from springtime.services.sheet_processor import (
    PreprocessedSheet,
    SheetPreprocessorImpl,
)

import openai
from pydantic import BaseModel
from springtime.models.open_ai import CompletionResponse, OpenAIModel


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
    token_length: int
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
    def __init__(self, token_length_service: TokenLengthService, model: OpenAIModel):
        self._token_length_service = token_length_service
        self._preprocessor = self.openai_preprocess()
        self.model = model

    def openai_preprocess(self):
        def get_length(text: str) -> int:
            return self._token_length_service.gpt4(text)

        return SheetPreprocessorImpl(get_length, GPT4_TOKEN_LIMIT)

    def analyze(self, *, excel_file: pd.ExcelFile) -> AnalyzeResponse:
        acc: list[AnalyzeResponseChunk] = []

        xl = pd.ExcelFile(excel_file)
        preprocessed = self._preprocessor.preprocess(xl=xl)
        chunks = self._preprocessor.chunk(preprocessed)

        logger.info(f"{len(chunks)} Chunks being analyzed")
        for sheet_chunk in chunks.sheets:
            table_content = "\n---\n".join(
                [self.format_sheet(sheet) for sheet in sheet_chunk]
            )
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

    def format_sheet(self, sheet: PreprocessedSheet) -> str:
        return f"""
Sheet name: {sheet.sheet_name}
Sheet content: {sheet.stringified_sheet.content}
""".strip()

    def _chat_completion(self, table: str) -> CompletionResponse:
        completion = openai.ChatCompletion.create(
            model=self.model,
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
