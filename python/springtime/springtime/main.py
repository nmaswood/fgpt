from loguru import logger
from springtime.llm.table_analyzer import TableAnalyzerImpl
from springtime.object_store.object_store import GCSObjectStore
from springtime.excel.table_extractor import TabulaTableExtractor
from springtime.routers.ml_router import MLRouter

from springtime.routers.pdf_router import PdfRouter
import uvicorn

from fastapi import FastAPI

from springtime.routers.table_router import TableRouter

from .settings import SETTINGS

app = FastAPI()

logger.info("Starting server")

OBJECT_STORE = GCSObjectStore()
TABLE_EXTRACTOR = TabulaTableExtractor(OBJECT_STORE)
TABLE_ANALYZER = TableAnalyzerImpl()

app.include_router(MLRouter().get_router())
app.include_router(PdfRouter(TABLE_EXTRACTOR).get_router())
app.include_router(TableRouter(TABLE_ANALYZER, OBJECT_STORE).get_router())


@app.get("/ping")
async def ping():
    return {"ping": "ping"}


# todo disable reload in prod


def start():
    uvicorn.run(
        "springtime.main:app",
        host=SETTINGS.host,
        port=SETTINGS.port,
        reload=SETTINGS.reload,
    )
