import os

import pytest

from springtime.services.report_service import (
    OpenAIReportService,
    ReportService,
)

PATH_FOR_TEXT = os.path.join(
    os.path.dirname(__file__),
    "../data/american-cim-chunk-1.txt",
)


@pytest.fixture()
def text():
    with open(PATH_FOR_TEXT) as f:
        return f.read()


@pytest.fixture()
def openai_report_service():
    return OpenAIReportService()


def test_generate_output(text: str, openai_report_service: ReportService):
    questions = openai_report_service.generate_questions(text)
    assert questions[0]

    question = questions[0]

    assert len(question.value) == 3
