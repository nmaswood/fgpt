from pydantic import BaseModel


class ChatHistory(BaseModel):
    question: str
