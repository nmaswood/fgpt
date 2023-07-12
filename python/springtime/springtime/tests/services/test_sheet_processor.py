from unittest.mock import MagicMock
import pytest
import os

import pandas as pd
from springtime.routers.token_length_service import TokenLengthService

from springtime.services.sheet_processor import SheetPreprocessor, SheetPreprocessorImpl

XLSX = os.path.join(os.path.dirname(__file__), "../data/dummy-extracted.xlsx")


@pytest.fixture
def sheet_preprocessor():
    anthropic = MagicMock()
    token_length_service = TokenLengthService(anthropic)
    return SheetPreprocessorImpl(
        get_length=token_length_service.gpt4,
        max_length=5_000,
    )


def test_preprocessor(sheet_preprocessor: SheetPreprocessor):
    xl = pd.ExcelFile(XLSX)

    res = sheet_preprocessor.preprocess(xl=xl)
    chunked = sheet_preprocessor.chunk(res)
    assert len(chunked.sheets) > 0
