import abc

from pydantic import BaseModel


class AnalyzeArguments(BaseModel):
    pass


class AnalyzeResponse(BaseModel):
    pass


class TableAnalyzer(abc.ABC):
    @abc.abstractmethod
    def analyze(self, args: AnalyzeArguments) -> AnalyzeResponse:
        pass


class TableAnalyzerImpl(TableAnalyzer):
    def __init__(self):
        pass

    def analyze(self, args: AnalyzeArguments) -> AnalyzeResponse:
        raise NotImplementedError()
