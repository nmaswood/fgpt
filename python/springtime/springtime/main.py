from pydantic import BaseModel
import uvicorn
from fastapi import FastAPI, Body
from .settings import SETTINGS

app = FastAPI()


@app.get("/")
async def root():
    return {"ping": "ping"}


class PredictionInput(BaseModel):
    prompt: str


@app.post("/predict")
async def predict(prompt: PredictionInput):
    return prompt


@app.post("/items/")
async def create_item(item_name: str, item_description: str = Body(...)):
    item = {"name": item_name, "description": item_description}
    return item


def start():
    uvicorn.run("springtime.main:app", host=SETTINGS.host,
                port=SETTINGS.port, reload=True)
