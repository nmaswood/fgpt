import os

import pytest

from springtime.models.open_ai import OpenAIModel
from springtime.services.anthropic_client import AnthropicClient
from springtime.services.excel_analyzer import OpenAIExcelAnalyzer
from springtime.services.report_service import (
    ClaudeReportService,
    OpenAIReportService,
    ReportService,
)

PATH_FOR_TEXT = os.path.join(
    os.path.dirname(__file__),
    "../data/american-cim-chunk-1.txt",
)

GPT_EXCEL_ANALYZER = OpenAIExcelAnalyzer(OpenAIModel.gpt3_16k)


@pytest.fixture()
def text():
    with open(PATH_FOR_TEXT) as f:
        return f.read()


@pytest.fixture()
def openai_report_service():
    return OpenAIReportService(OpenAIModel.gpt3_16k)


@pytest.fixture()
def claude_report_service():
    return ClaudeReportService(
        AnthropicClient(),
    )


def test_generate_output(text: str, openai_report_service: ReportService):
    questions = openai_report_service.generate_questions(text)
    breakpoint()


# def test_generate_output(text: str, claude_report_service: ReportService):
