import os

import pandas as pd

from springtime.services.sheet_processor import (
    CLAUDE_SHEET_PROCESSOR,
    GPT_SHEET_PROCESSOR,
)

XLSX = os.path.join(os.path.dirname(__file__), "../data/dummy-extracted.xlsx")


def test_preprocessor():
    xl = pd.ExcelFile(XLSX)

    for sheet_preprocessor in [CLAUDE_SHEET_PROCESSOR, GPT_SHEET_PROCESSOR]:
        res = sheet_preprocessor.preprocess(xl=xl)
        chunked = sheet_preprocessor.chunk(res)
