import abc
from loguru import logger

import pandas as pd

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

    def _input_chunk_from_sheets(
        self, excel_file: pd.ExcelFile, sheet_names: list[str]
    ) -> InputChunk:
        acc: list[str] = []

        for sheet_name in sheet_names:
            parsed_sheet = excel_file.parse(sheet_name)
            sheet_as_String = parsed_sheet.to_string(
                show_dimensions=False, index_names=False, index=False, na_rep=""
            )

            acc.append(f"{sheet_name}:{parsed_sheet.to_string()}")

        return InputChunk(prompt="\n".join(acc), sheet_names=sheet_names)
