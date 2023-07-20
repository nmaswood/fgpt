import abc

from pydantic import BaseModel

from springtime.models.open_ai import OpenAIModel


class ScanResult(BaseModel):
    description: str


class ScanService(abc.ABC):
    @abc.abstractmethod
    def scan(
        self,
        *,
        file_name: str,
        text: str,
    ) -> ScanResult:
        return ScanResult(description="")


class OpenAIScanService(ScanService):
    def __init__(self, model: OpenAIModel) -> None:
        pass

    def scan(
        self,
        *,
        file_name: str,
        text: str,
    ) -> ScanResult:
        return ScanResult(description="I love cats")
