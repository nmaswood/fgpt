from springtime.llm.pinecone import UpsertVector, get_similar, upsert_vectors
from springtime.llm.models import ChatHistory
from springtime.llm.ml import FinancialSummary,  PlaygroundRequest, Term, ask_question_streaming, embeddings_for_documents, ask_question, call_function, get_output
from starlette.responses import StreamingResponse
from springtime.llm.generate_title import generate_title_streaming, GenerateTitleRequest
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel
BaseModel


class TokenLengthRequest(BaseModel):
    text: str


class AskQuestionRequest(BaseModel):
    context: str
    question: str
    history: list[ChatHistory]


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


class MLRouter():

    def __init__(self):
        pass

    def get_router(self):

        router = APIRouter()

        @router.put("/upsert-vectors")
        async def upsert_vectors_route(req: UpsertVectorRequest):
            if req.vectors:
                upsert_vectors(req.vectors)
            return {"upsert_count": len(req.vectors)}

        @router.post("/similar-vectors")
        async def similar_vectors_route(req: SimilarVectorRequest):
            results = get_similar(req.vector, req.metadata)
            return {"results": results}

        @router.post("/playground")
        async def playground_route(req: PlaygroundRequest):
            raw = call_function(req)
            return PlaygroundResponse(raw=raw)

        @router.post("/ask-question")
        async def ask_question_route(req: AskQuestionRequest):
            answer = ask_question(req.context, req.question)

            return {"data": answer}

        @router.post("/embedding-for-documents")
        async def embeddings_for_documents_route(req: EmbeddingForDocumentRequest):
            response = embeddings_for_documents(req.documents)
            return EmbeddingForDocumentResponse(response=response)

        @router.post("/ask-question-streaming")
        async def ask_question_streaming_route(req: AskQuestionRequest):
            stream = ask_question_streaming(
                req.context, req.question, req.history)
            response = StreamingResponse(
                content=stream,
                media_type='text/event-stream'
            )
            return response

        @router.post("/llm-output")
        async def llm_output_route(req: LLMOutputRequest):
            res = get_output(req.text)
            return res

        @router.post("/generate-title-streaming")
        async def generate_title_streaming_route(req: GenerateTitleRequest):
            stream = generate_title_streaming(req)
            response = StreamingResponse(
                content=stream,
                media_type='text/event-stream'
            )
            return response

        return router
