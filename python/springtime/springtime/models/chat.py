from pydantic import BaseModel


class ChatHistory(BaseModel):
    question: str
    answer: str


class ChatChunkContext(BaseModel):
    order: int
    content: str


class ChatFileContext(BaseModel):
    file_name: str
    chunks: list[ChatChunkContext]
