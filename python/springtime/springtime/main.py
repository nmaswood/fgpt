from pydantic import BaseModel
import uvicorn
from fastapi import FastAPI, Body

from springtime.llm.foo import message_completions
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


def start():
    uvicorn.run("springtime.main:app", host=SETTINGS.host,
                port=SETTINGS.port, reload=True)
