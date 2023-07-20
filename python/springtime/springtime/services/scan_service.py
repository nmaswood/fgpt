import abc

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


class OpenAIScanService(ScanService):
    def __init__(self, model: OpenAIModel) -> None:
        self.model = model

    def scan(
        self,
        *,
        file_name: str,
        text: str,
    ) -> ScanResult:
        response = openai.ChatCompletion.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert financial analyst. You will be given an excerpt from a file a has uploaded. Your job is to write a verry concise description of the file. Do not respond with anything except the description",
                },
                {
                    "role": "user",
                    "content": f"""
file name: {file_name}
file excerpt: {text}
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
