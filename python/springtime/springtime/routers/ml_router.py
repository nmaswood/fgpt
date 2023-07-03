from springtime.llm.chat_service import ChatService
from springtime.llm.embeddings import EmbeddingsService
from springtime.llm.pinecone import (
    UpsertVector,
    VectorService,
)
from springtime.llm.models import ChatHistory
from springtime.llm.ml import (
    FinancialSummary,
    PlaygroundRequest,
    Term,
    call_function,
    get_output,
)
from starlette.responses import StreamingResponse
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel

from springtime.llm.token import get_token_length


class AskQuestionRequest(BaseModel):
    context: str
    question: str
    history: list[ChatHistory]


class TokenLengthRequest(BaseModel):
    text: str


class AskQuestionResponse(BaseModel):
    response: str


class LLMOutputRequest(BaseModel):
    text: str


class LLMOutputResponse(BaseModel):
    summaries: list[str] = []
    questions: list[str] = []
    terms: list[Term] = []
    financial_summary: FinancialSummary


class EmbeddingForDocumentRequest(BaseModel):
    documents: list[str]


class EmbeddingForDocumentResponse(BaseModel):
    response: list[list[float]]


class UpsertVectorRequest(BaseModel):
    vectors: list[UpsertVector]


class SimilarVectorRequest(BaseModel):
    vector: list[float]
    metadata: dict[str, Any]


class PlaygroundResponse(BaseModel):
    raw: dict[str, Any]


class MLRouter:
    def __init__(
        self,
        embeddings_service: EmbeddingsService,
        vector_service: VectorService,
        chat_service: ChatService,
    ):
        self.embeddings_service = embeddings_service
        self.vector_service = vector_service
        self.chat_service = chat_service

    def get_router(self):
        router = APIRouter()

        @router.put("/upsert-vectors")
        async def upsert_vectors_route(req: UpsertVectorRequest):
            if req.vectors:
                self.vector_service.upsert(req.vectors)
            return {"upsert_count": len(req.vectors)}

        @router.post("/similar-vectors")
        async def similar_vectors_route(req: SimilarVectorRequest):
            results = self.vector_service.get_similar(req.vector, req.metadata)
            return {"results": results}

        @router.post("/playground")
        async def playground_route(req: PlaygroundRequest):
            raw = call_function(req)
            return PlaygroundResponse(raw=raw)

        @router.post("/ask-question")
        async def ask_question_route(req: AskQuestionRequest):
            answer = self.chat_service.ask(req.context, req.question)

            return {"data": answer}

        @router.post("/embedding-for-documents")
        async def embeddings_for_documents_route(req: EmbeddingForDocumentRequest):
            response = self.embeddings_service.embed_documents(req.documents)
            return EmbeddingForDocumentResponse(response=response)

        @router.post("/ask-question-streaming")
        async def ask_question_streaming_route(req: AskQuestionRequest):
            stream = self.chat_service.ask_streaming(
                req.context, req.question, req.history
            )
            response = StreamingResponse(content=stream, media_type="text/event-stream")
            return response

        @router.post("/llm-output")
        async def llm_output_route(req: LLMOutputRequest):
            res = get_output(req.text)
            return res

        @router.post("/token-length")
        async def token_length_route(req: TokenLengthRequest):
            return get_token_length(req.text)

        return router
