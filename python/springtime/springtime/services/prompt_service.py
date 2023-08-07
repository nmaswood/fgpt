import abc

import pydantic
from anthropic import Anthropic

from springtime.services.html import html_from_text


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
        req: PromptRequest,
    ) -> PromptResponse:
        prompt = """
Human: {template}



Assistant:
""".format(
            template=req.template,
        )

        prompt = prompt.format(**req.args)

        input_tokens = self.anthropic.count_tokens(prompt)
        response = self.anthropic.completions.create(
            model="claude-2",
            max_tokens_to_sample=1_000_000,
            prompt=prompt,
        ).completion.strip()
        output_tokens = self.anthropic.count_tokens(response)
        html = html_from_text(response)

        return PromptResponse(
            raw=response,
            html=html,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            prompt=prompt,
        )
