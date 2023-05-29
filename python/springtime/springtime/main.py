import time
from typing import Any
from pydantic import BaseModel
from pydantic.schema import get_schema_ref
import uvicorn
from starlette.responses import StreamingResponse
from fastapi import status, HTTPException


from fastapi import FastAPI, Body


from springtime.llm.ml import ask_question, embeddings_for_documents
from springtime.llm.pinecone import UpsertVector, get_similar, upsert_vectors
from .settings import SETTINGS

app = FastAPI()


@app.get("/ping")
async def ping():
    return {"ping": "ping"}


class AskQuestionRequest(BaseModel):
    context: str
    question: str


class AskQuestionResponse(BaseModel):
    response: str


@app.post("/ask-question")
async def ask_question_route(req: AskQuestionRequest):
    stream = ask_question(req.context, req.question)
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
