from typing import Literal

from pydantic import BaseModel, Field


class SingleLocation(BaseModel):
    type: Literal["single"]
    page: int


class RangeLocation(BaseModel):
    type: Literal["range"]
    start: int
    end: int


class ChatHistory(BaseModel):
    question: str
    answer: str


class ChatChunkContext(BaseModel):
    order: int
    content: str
    location: SingleLocation | RangeLocation | None = Field(discriminator="type")


class ChatFileContext(BaseModel):
    file_name: str
    chunks: list[ChatChunkContext]
