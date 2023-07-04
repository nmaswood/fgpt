import pytest
from unittest.mock import MagicMock
import os

import pandas as pd

from springtime.services.table_analyzer import TableAnalyzer, TableAnalyzerImpl

XLSX = os.path.join(os.path.dirname(__file__), "../data/dummy-extracted.xlsx")


@pytest.mark.openai
@pytest.fixture
def table_analyzer():
    object_store = MagicMock()
    return TableAnalyzerImpl()


def test_analyze(table_analyzer: TableAnalyzer):
    xl = pd.ExcelFile(XLSX)
    resp = table_analyzer.analyze(
        excel_file=xl,
    )
    chunks = resp.chunks
    assert len(chunks) > 0
