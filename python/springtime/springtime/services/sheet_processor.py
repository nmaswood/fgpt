from typing import NamedTuple

from collections.abc import Callable
import abc
from loguru import logger


import pandas as pd


class StringifiedSheet(NamedTuple):
    content: str
    token_length: int
    was_truncated: bool


class PreprocessedSheet(NamedTuple):
    sheet_name: str
    parsed_sheet: dict[str, pd.DataFrame]
    stringified_sheet: StringifiedSheet


class ChunkedSheets(NamedTuple):
    sheets: list[list[PreprocessedSheet]]


class SheetPreprocessor(abc.ABC):
    @abc.abstractmethod
    def preprocess(self, *, xl: pd.ExcelFile) -> list[PreprocessedSheet]:
        pass

    @abc.abstractmethod
    def chunk(self, sheets: list[PreprocessedSheet]) -> ChunkedSheets:
        pass


class SheetPreprocessorImpl(SheetPreprocessor):
    def __init__(self, get_length: Callable[[str], int], max_length: int):
        self._get_length = get_length
        self._max_length = max_length

    def preprocess(self, *, xl: pd.ExcelFile) -> list[PreprocessedSheet]:
        acc: list[PreprocessedSheet] = []
        for sheet_name in xl.sheet_names:
            parsed_sheet = xl.parse(sheet_name)
            stringfied_sheet = self.stringify_sheet(parsed_sheet)
            if stringfied_sheet is None:
                logger.warning(
                    f"Sheet {sheet_name} is too long to be processed. Skipping it."
                )
                continue

            acc.append(
                PreprocessedSheet(
                    sheet_name=sheet_name,
                    parsed_sheet=parsed_sheet,
                    stringified_sheet=stringfied_sheet,
                )
            )
        return acc

    STRINGIFY_ATTEMPTS = 5

    def stringify_sheet(self, sheet: pd.DataFrame) -> StringifiedSheet | None:
        total_rows = sheet.shape[0]
        for attempt in range(self.STRINGIFY_ATTEMPTS):
            if attempt == 0:
                sheet_end = None
            else:
                sheet_end = total_rows / 2**attempt

            sheet_as_string = sheet[:sheet_end].to_csv(index=False)
            length = self._get_length(sheet_as_string)
            if length < self._max_length:
                return StringifiedSheet(
                    content=sheet_as_string,
                    token_length=length,
                    was_truncated=attempt > 0,
                )
        return None

    def chunk(self, sheets: list[PreprocessedSheet]) -> ChunkedSheets:
        acc = ChunkedSheets(sheets=[])
        curr: list[PreprocessedSheet] = []
        curr_len = 0

        for sheet in sheets:
            if curr_len + sheet.stringified_sheet.token_length > self._max_length:
                acc.sheets.append(curr)
                curr = []
                curr_len = 0
            else:
                curr.append(sheet)
                curr_len += sheet.stringified_sheet.token_length
        if curr:
            acc.sheets.append(curr)

        return acc
