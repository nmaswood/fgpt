import abc
from typing import NamedTuple
from loguru import logger

import pandas as pd
from springtime.llm.token import TokenLengthResponse, get_token_length

from springtime.utils.chunks import chunks
import openai
from pydantic import BaseModel
from springtime.llm.open_ai_types import CompletionResponse


from springtime.llm.prompts import EXCEL_SYSTEM_CONTEXT


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


class AnalyzeResponse(BaseModel):
    chunks: list[AnalyzeResponseChunk]


class TableAnalyzer(abc.ABC):
    @abc.abstractmethod
    def analyze(self, *, excel_file: pd.ExcelFile) -> AnalyzeResponse:
        return None


class TableAnalyzerImpl(TableAnalyzer):
    def __init__(self):
        pass

    def analyze(self, *, excel_file: pd.ExcelFile) -> AnalyzeResponse:
        acc: list[AnalyzeResponseChunk] = []

        xl = pd.ExcelFile(excel_file)
        preprocessed = self.preprocess(xl)

        for sheet_chunk in chunks(xl.sheet_names, 10):
            logger.info(f"Starting to analyze Analyzing sheet chunk: {sheet_chunk}")
            input_chunk = self._input_chunk_from_sheets(xl, sheet_chunk)
            resp = self._chat_completion(input_chunk.prompt)
            content = resp.choices[0].message.content

            acc.append(
                AnalyzeResponseChunk(
                    sheet_names=input_chunk.sheet_names,
                    content=content,
                    prompt=input_chunk.prompt,
                )
            )

            logger.info(f"Finished analyzing sheet chunk: {sheet_chunk}")

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

    def preprocess(self, xl: pd.ExcelFile) -> list[_PreprocessedSheet]:
        acc: list[_PreprocessedSheet] = []
        for sheet_name in xl.sheet_names:
            parsed_sheet = xl.parse(sheet_name)
            sheet_as_string = parsed_sheet.to_string(
                show_dimensions=False, index_names=False, index=False, na_rep=""
            )
            token_len = get_token_length(sheet_as_string)
            acc.append(
                _PreprocessedSheet(
                    sheet_name=sheet_name,
                    token_length=token_len,
                    parsed_sheet=parsed_sheet,
                )
            )
        return acc


def chunker(sheets: list[_PreprocessedSheet]) -> list[list[_PreprocessedSheet]]:
    acc: list[list[_PreprocessedSheet]] = []
    curr: list[_PreprocessedSheet] = []
    curr_len = 0

    return acc
