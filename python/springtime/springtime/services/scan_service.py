import abc
import json
import re
from enum import Enum

import openai
from pydantic import BaseModel, Field

from springtime.models.open_ai import OpenAIModel


class ScanResult(BaseModel):
    description: str
    tags: list[str]


class ScanService(abc.ABC):
    @abc.abstractmethod
    def scan(
        self,
        *,
        file_name: str,
        text: str,
    ) -> ScanResult:
        pass


LIMIT = 7000


class Answer(str, Enum):
    red = "red"
    yellow = "yellow"
    green = "green"


class ScanSchema(BaseModel):
    description: str = Field(
        description="A concise 1 line description of the document",
    )
    tags: list[str] = Field(description="tags describing the category of the document")
    is_financial_document: Answer = Field(
        description="Is this is a financial document? Respond with green if you very sure, yellow if you are unsure, and red if you are very sure it is not a financial document ",
    )


SCHEMA = ScanSchema.schema()


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

        completion = openai.ChatCompletion.create(
            model=self.model,
            messages=[
                {
                    "role": "user",
                    "content": f"""
file name: {file_name}
file excerpt: {with_out_white_space}
                 """,
                },
            ],
            functions=[{"name": "parse_data", "parameters": SCHEMA}],
            function_call={"name": "parse_data"},
            temperature=0,
        )

        res = completion.choices[0].message.function_call.arguments

        as_json = json.loads(res)
        breakpoint()

        return parse_response(description)


def parse_response(response: str) -> ScanResult:
    start = response.find("Description:")
    end = response.find("Tags:")

    description = response[start:end].split("Description:")[1].strip()
    tag_string = response[end:].split("Tags:")[1].strip()
    tags = sorted({tag.strip() for tag in tag_string.split(",")})
    return ScanResult(description=description, tags=tags)


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
