from fastapi import APIRouter
from pydantic import BaseModel, NonNegativeInt

from springtime.routers.token_length_service import TokenLengthService


class TokenLengthRequest(BaseModel):
    text: str


class TokenLengthResponse(BaseModel):
    gpt4: NonNegativeInt
    claude100k: NonNegativeInt


class TextRouter:
    def __init__(self, token_length_service: TokenLengthService):
        self.token_length_service = token_length_service

    def get_router(self):
        router = APIRouter(prefix="/text")

        @router.post("/token-length")
        async def token_length_route(req: TokenLengthRequest):
            return TokenLengthResponse(
                gpt4=self.token_length_service.gpt4(req.text),
                claude100k=self.token_length_service.claude100k(req.text),
            )

        return router
