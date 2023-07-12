import pytest
from unittest.mock import MagicMock
import os

import pandas as pd
from springtime.models.open_ai import OpenAIModel

from springtime.services.table_analyzer import TableAnalyzer, TableAnalyzerImpl
from springtime.routers.token_length_service import TokenLengthService

XLSX = os.path.join(os.path.dirname(__file__), "../data/dummy-extracted.xlsx")


@pytest.fixture
def table_analyzer():
    anthropic = MagicMock()
    token_length_service = TokenLengthService(anthropic)
    return TableAnalyzerImpl(token_length_service, model=OpenAIModel.gpt3_16k)


def test_analyze(table_analyzer: TableAnalyzer):
    xl = pd.ExcelFile(XLSX)
    resp = table_analyzer.analyze(
        excel_file=xl,
    )
    chunks = resp.chunks
    breakpoint()
    assert len(chunks) > 0
