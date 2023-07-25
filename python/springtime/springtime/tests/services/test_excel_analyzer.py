import os

import pandas as pd
import pytest

from springtime.models.open_ai import OpenAIModel
from springtime.services.anthropic_client import AnthropicClient
from springtime.services.excel_analyzer import (
    ClaudeExcelAnalyzer,
    ExcelAnalyzer,
    OpenAIExcelAnalyzer,
)
from springtime.services.sheet_processor import (
    CLAUDE_SHEET_PROCESSOR,
    GPT_SHEET_PROCESSOR,
)

XLSX = os.path.join(
    os.path.dirname(__file__),
    "../data/wet-noses-sales-and-margin.xlsx",
)


@pytest.fixture()
def gpt_analyzer():
    return OpenAIExcelAnalyzer(OpenAIModel.gpt3_16k)


@pytest.fixture()
def claude_analyzer():
    client = AnthropicClient()
    return ClaudeExcelAnalyzer(client)


@pytest.mark.skipif(False, reason="")
def test_analyze_claude(claude_analyzer: ExcelAnalyzer):
    xl = pd.ExcelFile(XLSX)
    sheets = CLAUDE_SHEET_PROCESSOR.preprocess(xl=xl)
    resp = claude_analyzer.analyze(sheets=sheets)
    breakpoint()


@pytest.mark.skipif(True, reason="")
def test_analyze_gpt(gpt_analyzer: ExcelAnalyzer):
    xl = pd.ExcelFile(XLSX)
    sheets = GPT_SHEET_PROCESSOR.preprocess(xl=xl)
    resp = gpt_analyzer.analyze(sheets=sheets)
    breakpoint()
