import uvicorn
from fastapi import FastAPI
from .settings import SETTINGS

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}


def start():
    uvicorn.run("springtime.main:app", host=SETTINGS.host,
                port=SETTINGS.port, reload=True)
