import abc
from loguru import logger

import pandas as pd
from springtime.services.sheet_processor import (
    SheetPreprocessor,
)

from pydantic import BaseModel
from springtime.services.excel_analyzer import ExcelAnalyzer


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


GPT4_TOKEN_LIMIT = 5000


class TableAnalyzerImpl(TableAnalyzer):
    def __init__(
        self, excel_analyzer: ExcelAnalyzer, sheet_processor: SheetPreprocessor
    ):
        self.excel_analyzer = excel_analyzer
        self.sheet_preprocessor = sheet_processor

    def analyze(self, *, excel_file: pd.ExcelFile) -> AnalyzeResponse:
        acc: list[AnalyzeResponseChunk] = []

        xl = pd.ExcelFile(excel_file)
        preprocessed = self.sheet_preprocessor.preprocess(xl=xl)
        chunks = self.sheet_preprocessor.chunk(preprocessed)

        logger.info(f"{len(chunks)} Chunks being analyzed")
        for sheet_chunk in chunks.sheets:
            resp = self.excel_analyzer.analyze(sheets=sheet_chunk)

            acc.append(
                AnalyzeResponseChunk(
                    sheet_names=[sheet.sheet_name for sheet in sheet_chunk],
                    content=resp.content,
                    prompt=resp.prompt,
                )
            )

            sheet_names = ", ".join([sheet.sheet_name for sheet in sheet_chunk])
            logger.info(f"Finished analyzing sheet chunk: {sheet_names}")

        return AnalyzeResponse(chunks=acc)
