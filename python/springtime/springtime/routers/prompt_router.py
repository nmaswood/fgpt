from fastapi import APIRouter
from pydantic import BaseModel, NonNegativeInt

from springtime.services.prompt_service import PromptService


class RunRequest(BaseModel):
    template: str
    args: dict[str, str]


class TokenLengthResponse(BaseModel):
    gpt4: NonNegativeInt
    claude100k: NonNegativeInt


class PromptRouter:
    def __init__(self, prompt_service: PromptService) -> None:
        self.prompt_service = prompt_service

    def get_router(self):
        router = APIRouter(prefix="/prompt")

        @router.post("/run")
        def run_route(req: RunRequest):
            return self.prompt_service.run(req)

        return router
