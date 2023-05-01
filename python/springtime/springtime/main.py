from pydantic import BaseModel
import uvicorn
from fastapi import FastAPI, Body


from springtime.llm.ml import embeddings_for_documents, message_completions
from .settings import SETTINGS

app = FastAPI()


@app.get("/")
async def root():
    return {"ping": "ping"}


@app.get("/ping")
async def ping():
    return {"ping": "ping"}


class PredictionInput(BaseModel):
    content: str


@app.post("/predict-for-ticker")
async def predict_for_ticker(prompt: PredictionInput):

    resp = message_completions(prompt.content)
    text = resp.content
    return {"resp": resp.content}


class EmbeddingForDocument(BaseModel):
    documents: list[str]


@app.post("/embedding-for-document")
async def embeddings_for_documents_route(params: EmbeddingForDocument):
    res = embeddings_for_documents(params.documents)
    return {"resp": res}


def start():
    uvicorn.run("springtime.main:app", host=SETTINGS.host,
                port=SETTINGS.port, reload=True)
