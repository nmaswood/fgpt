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


@pytest.mark.skipif(True, reason="")
def test_generate_output(text: str, openai_report_service: ReportService):
    pages = openai_report_service.generate_questions(text)
    assert pages[0]

    question = pages[0]

    assert len(question.value) == 3


def test_generate_terms(text: str, openai_report_service: ReportService):
    pages = openai_report_service.generate_terms(text)
    assert pages[0]

    terms = pages[0].value
    print(terms)
    breakpoint()
