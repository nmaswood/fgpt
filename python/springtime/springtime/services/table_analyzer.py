import abc
from typing import NamedTuple
from loguru import logger

import pandas as pd
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
        pass

    def analyze(self, *, excel_file: pd.ExcelFile) -> AnalyzeResponse:
        acc: list[AnalyzeResponseChunk] = []

        xl = pd.ExcelFile(excel_file)
        preprocessed = self.preprocess(xl)

        chunks = chunker(GPT4_TOKEN_LIMIT, preprocessed)

        logger.info(f"{len(chunks)} Chunks being analyzed")
        for sheet_chunk in chunks:
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
                    sheet_as_string=sheet_as_string,
                )
            )
        return acc


def chunker(
    token_limit: int, sheets: list[_PreprocessedSheet]
) -> list[list[_PreprocessedSheet]]:
    acc: list[list[_PreprocessedSheet]] = []
    curr: list[_PreprocessedSheet] = []
    curr_len = 0

    for sheet in sheets:
        if sheet.token_length.gpt4 > token_limit:
            logger.warning(
                f"Skipping sheet {sheet.sheet_name} due to token length {sheet.token_length.gpt4} > {token_limit}"
            )
            continue

        if curr_len + sheet.token_length.gpt4 > token_limit:
            acc.append(curr)
            curr = []
            curr_len = 0
        else:
            curr.append(sheet)
            curr_len += sheet.token_length.gpt4
    if curr:
        acc.append(curr)

    return acc
