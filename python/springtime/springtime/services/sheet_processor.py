import abc
from collections.abc import Callable
from typing import NamedTuple

import pandas as pd
from loguru import logger

from springtime.routers.token_length_service import TokenLength


class StringifiedSheet(NamedTuple):
    content: str
    token_length: int
    was_truncated: bool


class PreprocessedSheet(NamedTuple):
    sheet_name: str
    index: int
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


GetLength = Callable[[str], int]


def preprocess(
    *,
    max_length: int,
    get_length: GetLength,
    xl: pd.ExcelFile,
) -> list[PreprocessedSheet]:
    acc: list[PreprocessedSheet] = []
    for index, sheet_name in enumerate(xl.sheet_names):
        parsed_sheet = xl.parse(sheet_name)
        stringfied_sheet = stringify_sheet(
            get_length=get_length,
            sheet=parsed_sheet,
            max_length=max_length,
        )
        if stringfied_sheet is None:
            logger.warning(
                f"Sheet {sheet_name} is too long to be processed. Skipping it.",
            )
            continue

        acc.append(
            PreprocessedSheet(
                sheet_name=sheet_name,
                parsed_sheet=parsed_sheet,
                stringified_sheet=stringfied_sheet,
                index=index,
            ),
        )
    return acc


STRINGIFY_ATTEMPTS = 10


def stringify_sheet(
    *,
    max_length: int,
    get_length: GetLength,
    sheet: pd.DataFrame,
) -> StringifiedSheet | None:
    total_rows = sheet.shape[0]
    for attempt in range(STRINGIFY_ATTEMPTS):
        sheet_end = None if attempt == 0 else int(total_rows / 2**attempt)

        sheet_as_string = sheet[:sheet_end].to_csv(index=False)
        length = get_length(sheet_as_string)
        if length < max_length:
            return StringifiedSheet(
                content=sheet_as_string,
                token_length=length,
                was_truncated=attempt > 0,
            )
    return None


def chunk(
    *,
    max_length: int,
    sheets: list[PreprocessedSheet],
) -> ChunkedSheets:
    acc = ChunkedSheets(sheets=[])
    curr: list[PreprocessedSheet] = []
    curr_len = 0

    for sheet in sheets:
        if curr_len + sheet.stringified_sheet.token_length > max_length:
            acc.sheets.append(curr)
            curr = []
            curr_len = 0
        else:
            curr.append(sheet)
            curr_len += sheet.stringified_sheet.token_length
    if curr:
        acc.sheets.append(curr)

    return acc


GPT4_TOKEN_LIMIT = 5000


class GPT4SheetProcessor(SheetPreprocessor):
    def preprocess(self, *, xl: pd.ExcelFile) -> list[PreprocessedSheet]:
        return preprocess(
            get_length=TokenLength.gpt4,
            max_length=GPT4_TOKEN_LIMIT,
            xl=xl,
        )

    def chunk(self, sheets: list[PreprocessedSheet]) -> ChunkedSheets:
        return chunk(
            max_length=GPT4_TOKEN_LIMIT,
            sheets=sheets,
        )


GPT_SHEET_PROCESSOR = GPT4SheetProcessor()

CLAUDE_TOKEN_LIMIT = 100_000


class ClaudeSheetProcessor(SheetPreprocessor):
    def preprocess(self, *, xl: pd.ExcelFile) -> list[PreprocessedSheet]:
        return preprocess(
            get_length=TokenLength.claude100k,
            max_length=CLAUDE_TOKEN_LIMIT,
            xl=xl,
        )

    def chunk(self, sheets: list[PreprocessedSheet]) -> ChunkedSheets:
        return chunk(
            max_length=CLAUDE_TOKEN_LIMIT,
            sheets=sheets,
        )


CLAUDE_SHEET_PROCESSOR = ClaudeSheetProcessor()
