import abc

import pydantic
from anthropic import Anthropic


class PromptRequest(pydantic.BaseModel):
    template: str
    args: dict[str, str]


class PromptResponse(pydantic.BaseModel):
    raw: str
    html: str | None
    input_tokens: pydantic.NonNegativeInt
    output_tokens: pydantic.NonNegativeInt
    prompt: str


class PromptService(abc.ABC):
    @abc.abstractmethod
    def run(
        self,
        req: PromptRequest,
    ) -> PromptResponse:
        pass


class PromptServiceImpl(
    PromptService,
):
    def __init__(self, anthropic: Anthropic) -> None:
        self.anthropic = anthropic

    def run(
        self,
        _: PromptRequest,
    ) -> PromptResponse:
        prompt = """
Human: Return a random response


Assistant:
"""
        msg = "not implemented"
        raise NotImplementedError(msg)
