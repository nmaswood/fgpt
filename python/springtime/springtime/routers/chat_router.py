from fastapi import APIRouter
from pydantic import BaseModel
from starlette.responses import StreamingResponse
from springtime.services.chat_service import ChatService
from springtime.models.chat import ChatHistory


class AskQuestionResponse(BaseModel):
    response: str


class AskQuestionRequest(BaseModel):
    context: str
    question: str
    history: list[ChatHistory]


class GetTitleRequest(BaseModel):
    question: str
    answer: str


class ChatRouter:
    def __init__(self, chat_service: ChatService):
        self.chat_service = chat_service

    def get_router(self):
        router = APIRouter(prefix="/chat")

        @router.post("/ask-question")
        async def ask_question_route(req: AskQuestionRequest):
            answer = self.chat_service.ask(req.context, req.question)

            return {"data": answer}

        @router.post("/ask-question-streaming")
        async def ask_question_streaming_route(req: AskQuestionRequest):
            stream = self.chat_service.ask_streaming(
                req.context, req.question, req.history
            )
            response = StreamingResponse(content=stream, media_type="text/event-stream")
            return response

        @router.post("/get-title-streaming")
        async def get_title_streaming_route(req: GetTitleRequest):
            stream = self.chat_service.get_title(req.question, req.answer)
            response = StreamingResponse(content=stream, media_type="text/event-stream")
            return response

        return router
