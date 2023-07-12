from fastapi import APIRouter
from pydantic import BaseModel, NonNegativeInt

from springtime.routers.token_length_service import TokenLength


class TokenLengthRequest(BaseModel):
    text: str


class TokenLengthResponse(BaseModel):
    gpt4: NonNegativeInt
    claude100k: NonNegativeInt


class TextRouter:
    def get_router(self):
        router = APIRouter(prefix="/text")

        @router.post("/token-length")
        async def token_length_route(req: TokenLengthRequest):
            return TokenLengthResponse(
                gpt4=TokenLength.gpt4(req.text),
                claude100k=TokenLength.claude100k(req.text),
            )

        return router
