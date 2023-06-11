from typing import Any
from loguru import logger
from pydantic import BaseModel
import uvicorn
from starlette.responses import StreamingResponse

from fastapi import FastAPI

from springtime.llm.ml import ask_question_streaming, embeddings_for_documents, ask_question
from springtime.llm.models import ChatHistory
from springtime.llm.pinecone import UpsertVector, get_similar, upsert_vectors
from .settings import SETTINGS

app = FastAPI()

logger.info("Starting server")


@app.get("/ping")
async def ping():
    return {"ping": "ping"}


class AskQuestionRequest(BaseModel):
    context: str
    question: str
    history: list[ChatHistory]


class AskQuestionResponse(BaseModel):
    response: str


@app.post("/ask-question")
async def ask_question_route(req: AskQuestionRequest):
    answer = ask_question(req.context, req.question)

    return {"data": answer}


class LLMOutputRequest(BaseModel):
    text: str



class LLMOutputResponse(BaseModel):
    summaries: list[str] = []
    questions: list[str] = []
    

@app.post("/llm-output")
async def llm_output_route(req: LLMOutputRequest):

    return LLMOutputResponse()



@app.post("/ask-question-streaming")
async def ask_question_streaming_route(req: AskQuestionRequest):
    stream = ask_question_streaming(req.context, req.question, req.history)
    response = StreamingResponse(
        content=stream,
        media_type='text/event-stream'
    )
    return response


class EmbeddingForDocumentRequest(BaseModel):
    documents: list[str]


class EmbeddingForDocumentResponse(BaseModel):
    response: list[list[float]]


@app.post("/embedding-for-documents")
async def embeddings_for_documents_route(req: EmbeddingForDocumentRequest):
    response = embeddings_for_documents(req.documents)
    return EmbeddingForDocumentResponse(response=response)


class UpsertVectorRequest(BaseModel):
    vectors: list[UpsertVector]


@app.put("/upsert-vectors")
async def upsert_vectors_route(req: UpsertVectorRequest):
    if req.vectors:
        upsert_vectors(req.vectors)
    return {"upsert_count": len(req.vectors)}


class SimilarVectorRequest(BaseModel):
    vector: list[float]
    metadata: dict[str, Any]


@app.post("/similar-vectors")
async def similar_vectors_route(req: SimilarVectorRequest):
    results = get_similar(req.vector, req.metadata)
    return {"results": results}


# todo disable reload in prod
def start():
    uvicorn.run("springtime.main:app", host=SETTINGS.host,
                port=SETTINGS.port,
                reload=True,
                )
