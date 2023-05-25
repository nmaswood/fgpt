from typing import Any
from pydantic import BaseModel
from pydantic.schema import get_schema_ref
import uvicorn
from fastapi import FastAPI, Body


from springtime.llm.ml import ask_question, embeddings_for_documents, message_completions, summarize
from springtime.llm.pinecone import UpsertVector, get_similar, upsert_vectors
from .settings import SETTINGS

app = FastAPI()


@app.get("/ping")
async def ping():
    return {"ping": "ping"}


class PredictForTickerRequest(BaseModel):
    content: str


class PredictForTickerResponse(BaseModel):
    response: str


@app.post("/predict-for-ticker")
async def predict_for_ticker_route(prompt: PredictForTickerRequest) -> PredictForTickerResponse:
    response = message_completions(prompt.content)
    return PredictForTickerResponse(response=response.content)


class AskQuestionRequest(BaseModel):
    context: str
    question: str


class AskQuestionResponse(BaseModel):
    response: str


@app.post("/ask-question")
async def ask_question_route(req: AskQuestionRequest) -> AskQuestionResponse:
    answer = ask_question(req.context, req.question)
    return AskQuestionResponse(response=answer.content)


class EmbeddingForDocumentRequest(BaseModel):
    documents: list[str]


class EmbeddingForDocumentResponse(BaseModel):
    response: list[list[float]]


@app.post("/embedding-for-documents")
async def embeddings_for_documents_route(req: EmbeddingForDocumentRequest):
    response = embeddings_for_documents(req.documents)
    return EmbeddingForDocumentResponse(response=response)


class SummaryRequest(BaseModel):
    text: str


class SummaryResponse(BaseModel):
    response: str


@app.post("/summarize")
async def summarize_route(req: SummaryRequest) -> SummaryResponse:
    response = summarize(req.text)
    return SummaryResponse(response=response.content)


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
    ids = get_similar(req.vector, req.metadata)
    return {"ids": ids}




# todo disable reload in prod
def start():
    uvicorn.run("springtime.main:app", host=SETTINGS.host,
                port=SETTINGS.port,
                reload=True,
                )
