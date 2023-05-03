from pydantic import BaseModel
import uvicorn
from fastapi import FastAPI, Body


from springtime.llm.ml import embeddings_for_documents, message_completions, summarize
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


def start():
    uvicorn.run("springtime.main:app", host=SETTINGS.host,
                port=SETTINGS.port, reload=True)
