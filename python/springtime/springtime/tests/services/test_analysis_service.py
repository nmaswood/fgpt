import os

import pandas as pd
import pytest

from springtime.models.open_ai import OpenAIModel
from springtime.services.analysis_service import AnalysisService, GPTAnalysisService
from springtime.services.excel_analyzer import OpenAIExcelAnalyzer
from springtime.services.sheet_processor import (
    GPT_SHEET_PROCESSOR,
)

XLSX = os.path.join(os.path.dirname(__file__), "../data/dummy-extracted.xlsx")


GPT_EXCEL_ANALYZER = OpenAIExcelAnalyzer(OpenAIModel.gpt3_16k)


@pytest.fixture()
def analysis_service():
    return GPTAnalysisService(GPT_SHEET_PROCESSOR, OpenAIModel.gpt3_16k)


def test_analyze(analysis_service: AnalysisService):
    xl = pd.ExcelFile(XLSX)
    resp = analysis_service.analyze(
        excel_file=xl,
    )
    chunks = resp.chunks
