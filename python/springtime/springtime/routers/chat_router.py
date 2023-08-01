from fastapi import APIRouter
from pydantic import BaseModel
from starlette.responses import StreamingResponse

from springtime.models.chat import ChatFileContext, ChatHistory
from springtime.services.chat_service import ChatService
from springtime.services.html import html_from_text


class AskQuestionResponse(BaseModel):
    response: str


class GetTitleRequest(BaseModel):
    question: str
    answer: str


class GetTitleResponse(BaseModel):
    title: str


class AskQuestionRequest(BaseModel):
    question: str
    history: list[ChatHistory]
    for_files: list[ChatFileContext]


class GetPromptResponse(BaseModel):
    prompt: str


class HtmlFromTextRequest(BaseModel):
    text: str


class HtmlFromTextResponse(BaseModel):
    html: str | None


class ChatRouter:
    def __init__(self, chat_service: ChatService) -> None:
        self.chat_service = chat_service

    def get_router(self):
        router = APIRouter(prefix="/chat")

        @router.post("/ask-question-streaming")
        def ask_question_streaming_route(req: AskQuestionRequest):
            stream = self.chat_service.ask_streaming(
                req.for_files,
                req.question,
                req.history,
            )
            return StreamingResponse(content=stream, media_type="text/event-stream")

        @router.post("/prompt")
        def prompt_route(req: AskQuestionRequest):
            prompt = self.chat_service.get_prompt(
                req.for_files,
                req.question,
                req.history,
            )

            return GetPromptResponse(prompt=prompt)

        @router.post("/get-title")
        def get_title_route(req: GetTitleRequest) -> GetTitleResponse:
            title = self.chat_service.get_title(req.question, req.answer)
            return GetTitleResponse(title=title)

        @router.post("/sanitize")
        def get_sanitize(req: HtmlFromTextRequest) -> HtmlFromTextResponse:
            html = html_from_text(req.text)
            return HtmlFromTextResponse(html=html)

        return router
