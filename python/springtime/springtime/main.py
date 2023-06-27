from loguru import logger
from springtime.llm.table_analyzer import TableAnalyzerImpl
from springtime.object_store.object_store import GCSObjectStore
from springtime.excel.table_extractor import TabulaTableExtractor
from springtime.routers.ml_router import MLRouter

from springtime.routers.pdf_router import PdfRouter
import uvicorn

from fastapi import FastAPI, Request 
from fastapi.responses import JSONResponse


from springtime.routers.table_router import TableRouter

from .settings import SETTINGS

app = FastAPI()

logger.info("Starting server plz")

OBJECT_STORE = GCSObjectStore()
TABLE_EXTRACTOR = TabulaTableExtractor(OBJECT_STORE)
TABLE_ANALYZER = TableAnalyzerImpl()



@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    response = await call_next(request)
    secret = request.headers.get('x-service-to-service-secret')

    if (secret != SETTINGS.service_to_service_secret):
        return JSONResponse(status_code=401, content='Not authorized')

    return response


app.include_router(MLRouter().get_router())
app.include_router(PdfRouter(TABLE_EXTRACTOR).get_router())
app.include_router(TableRouter(TABLE_ANALYZER, OBJECT_STORE).get_router())


@app.get("/ping")
async def ping():
    return {"ping": "ping"}


@app.get("/healthz")
async def healthz():
    return "OK"





# todo disable reload in prod


def start():
    uvicorn.run(
        "springtime.main:app",
        host=SETTINGS.host,
        port=SETTINGS.port,
        reload=SETTINGS.reload,
    )
