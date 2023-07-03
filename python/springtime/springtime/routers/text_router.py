from fastapi import APIRouter
from pydantic import BaseModel

from springtime.services.token import get_token_length


class TokenLengthRequest(BaseModel):
    text: str


class TextRouter:
    def __init__(self):
        pass

    def get_router(self):
        router = APIRouter(prefix="/text")

        @router.post("/token-length")
        async def token_length_route(req: TokenLengthRequest):
            return get_token_length(req.text)

        return router
