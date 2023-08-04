from enum import StrEnum

from pydantic import BaseModel, NonNegativeInt


class Usage(BaseModel):
    prompt_tokens: NonNegativeInt
    completion_tokens: NonNegativeInt
    total_tokens: NonNegativeInt


class Message(BaseModel):
    role: str
    content: str


class Choice(BaseModel):
    index: NonNegativeInt
    message: Message
    finish_reason: str


class CompletionResponse(BaseModel):
    usage: Usage
    model: str
    choices: list[Choice]


class OpenAIModel(StrEnum):
    gpt3 = "gpt-3.5-turbo"
    gpt3_16k = "gpt-3.5-turbo-16k"
    gpt4 = "gpt-4-0613"
