import os

import pytest

from springtime.models.open_ai import OpenAIModel
from springtime.services.excel_analyzer import OpenAIExcelAnalyzer
from springtime.services.report_service import OpenAIReportService, ReportService

PATH_FOR_TEXT = os.path.join(
    os.path.dirname(__file__), "../data/american-cim-chunk-1.txt",
)

GPT_EXCEL_ANALYZER = OpenAIExcelAnalyzer(OpenAIModel.gpt3_16k)


@pytest.fixture()
def text():
    with open(PATH_FOR_TEXT) as f:
        return f.read()


@pytest.fixture()
def report_service():
    return OpenAIReportService(OpenAIModel.gpt3_16k)


def test_generate_output(text: str, report_service: ReportService):
    output = report_service.generate_output(text)
    pass
