import pytest

from springtime.models.open_ai import OpenAIModel
from springtime.services.scan_service import OpenAIScanService, ScanService


@pytest.fixture()
def scan_service():
    return OpenAIScanService(OpenAIModel.gpt3_16k)


def test_scan(scan_service: ScanService):
    output = scan_service.scan(
        file_name="test.txt",
        text="I love cats",
    )

    assert output.description
