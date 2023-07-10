from typing import NamedTuple

from collections.abc import Callable
import abc


import pandas as pd


class PreprocessedSheet(NamedTuple):
    sheet_name: str
    token_length: int
    parsed_sheet: dict[str, pd.DataFrame]
    sheet_as_string: str


class ChunkedSheets(NamedTuple):
    sheets: list[list[PreprocessedSheet]]
    too_long: list[PreprocessedSheet]


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
            sheet_as_string = parsed_sheet.to_string(
                show_dimensions=False, index_names=False, index=False, na_rep=""
            )
            token_len = self._get_length(sheet_as_string)
            acc.append(
                PreprocessedSheet(
                    sheet_name=sheet_name,
                    token_length=token_len,
                    parsed_sheet=parsed_sheet,
                    sheet_as_string=sheet_as_string,
                )
            )
        return acc

    def chunk(self, sheets: list[PreprocessedSheet]) -> ChunkedSheets:
        acc = ChunkedSheets(sheets=[], too_long=[])
        curr: list[PreprocessedSheet] = []
        curr_len = 0

        for sheet in sheets:
            if sheet.token_length > self._max_length:
                acc.too_long.append(sheet)

                continue

            if curr_len + sheet.token_length > self._max_length:
                acc.sheets.append(curr)
                curr = []
                curr_len = 0
            else:
                curr.append(sheet)
                curr_len += sheet.token_length
        if curr:
            acc.sheets.append(curr)

        return acc
