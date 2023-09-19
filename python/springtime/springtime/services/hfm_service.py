import abc
import time
from typing import Literal

import anthropic
from anthropic import Anthropic
from loguru import logger
from pydantic import BaseModel


class RunHFMArguments(BaseModel):
    analysis: list[str]
    personas: list[str]
    text: str


class RunHFMResponse(BaseModel):
    ok: Literal[True]
    summary: str


class ForPersona(BaseModel):
    persona: str
    output: str


class HFMService(abc.ABC):
    @abc.abstractmethod
    def run(self, args: RunHFMArguments) -> RunHFMResponse:
        pass


LIMIT = 7000


class HFMServiceImpl(HFMService):
    def __init__(self, anthropic: Anthropic) -> None:
        self.anthropic = anthropic

    def run(self, args: RunHFMArguments) -> RunHFMResponse:
        logger.info("Starting to run HFM")
        personas = [self.for_persona(args.text, persona) for persona in args.personas]
        summary = self.summarize(args.text, personas)
        return RunHFMResponse(ok=True, summary=summary)

    def summarize(self, text: str, personas: list[ForPersona]):
        def for_persona_format(persona: ForPersona):
            return f"""
persona: {persona.persona}
output: {persona.output}
"""

        outputs = "\n".join(map(for_persona_format, personas))

        layer_one = """You will be given a document describing an investment oppurtunity.
        You will also be given a list of financial personas who have perspective on the oppurtunity.

        Summarize their findings by selecting by the best most relevant insights from each persona.

        Output your response is well formatted markdown.

        Personas:
        {outputs}

        Document: {text}
        """.format(
            text=text,
            outputs=outputs,
        )

        prompt = """
Human: {layer_one}


Assistant:
""".format(
            layer_one=layer_one,
        )

        return self.get_response(prompt)

    def for_persona(self, text: str, persona: str):
        logger.info(f"Analyzing information for {persona}")
        layer_one = """You are the following persona: {persona}
        Your goal is to review  the given document to evaluate whether it might be a good investment for the fund you are supporting.

        Please output a summary report of your thoughts on the investment.


        Document: {text}
        """.format(
            persona=persona,
            text=text,
        )

        prompt = """
Human: {layer_one}


Assistant:
""".format(
            layer_one=layer_one,
        )

        response = self.get_response(prompt)

        return ForPersona(
            persona=persona,
            output=response,
        )

    def get_response(self, prompt: str) -> str:
        for attempt in range(9):
            try:
                return self.anthropic.completions.create(
                    model="claude-2",
                    max_tokens_to_sample=1_000_000,
                    prompt=prompt,
                ).completion.strip()
            except anthropic.RateLimitError:
                seconds = 2 ** (attempt + 2)
                logger.info(f"Rate limit exceeded sleeping {seconds}")

                time.sleep(seconds)
        msg = "Rate limit exceeded"
        raise Exception(msg)
