import abc
import re

import openai
from loguru import logger
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


LIMIT = 7000


class OpenAIScanService(ScanService):
    def __init__(self, model: OpenAIModel) -> None:
        self.model = model

    def scan(
        self,
        *,
        file_name: str,
        text: str,
    ) -> ScanResult:
        processed_text = first_chunk(text, LIMIT)
        with_out_white_space = remove_extra_whitespace(processed_text)

        response = openai.ChatCompletion.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert financial analyst. You will be given an excerpt from a document. Provide a 1 line description of the document. Do not respond with anything except the description",
                },
                {
                    "role": "user",
                    "content": f"""
file name: {file_name}
file excerpt: {with_out_white_space}
                 """,
                },
            ],
            temperature=0,
        )
        choices = response["choices"]
        if len(choices) == 0:
            logger.warning("No choices returned from OpenAI")
        first_choice = choices[0]
        description = first_choice["message"]["content"]
        return ScanResult(description=description)


def remove_extra_whitespace(s: str) -> str:
    return re.sub(r"\n+", "\n", s.replace("\n ", "\n")).strip()


def first_chunk(s: str, maxlength: int):
    gen = get_chunks(s, maxlength)
    return next(gen)


def get_chunks(s: str, maxlength: int):
    start = 0
    end = 0
    while start + maxlength < len(s) and end != -1:
        end = s.rfind(" ", start, start + maxlength + 1)
        yield s[start:end]
        start = end + 1
    yield s[start:]
