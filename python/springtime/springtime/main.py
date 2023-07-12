from loguru import logger
from springtime.routers.chat_router import ChatRouter
from springtime.routers.embeddings_router import EmbeddingsRouter
from springtime.routers.text_router import TextRouter
from springtime.routers.vector_router import VectorRouter
from springtime.services.anthropic_client import AnthropicClient
from springtime.services.chat_service import OpenAIChatService
from springtime.services.embeddings_service import OpenAIEmbeddingsService
from springtime.services.excel_analyzer import ClaudeExcelAnalyzer, OpenAIExcelAnalyzer
from springtime.services.long_form_report_service import ClaudeLongformReportService
from springtime.services.report_service import OpenAIReportService
from springtime.services.sheet_processor import (
    CLAUDE_SHEET_PROCESSOR,
    GPT_SHEET_PROCESSOR,
)
from springtime.services.vector_service import PineconeVectorService
from springtime.services.table_analyzer import TableAnalyzerImpl
from springtime.object_store.object_store import GCSObjectStore
from springtime.excel.table_extractor import TabulaTableExtractor
from springtime.routers.report_router import ReportRouter

from springtime.routers.pdf_router import PdfRouter
import uvicorn

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


from springtime.routers.table_router import TableRouter

from .settings import SETTINGS

app = FastAPI()

logger.info("Starting server")

OBJECT_STORE = GCSObjectStore()
ANTHROPIC_CLIENT = AnthropicClient()
TABLE_EXTRACTOR = TabulaTableExtractor(OBJECT_STORE)

GPT_EXCEL_ANALYZER = OpenAIExcelAnalyzer(SETTINGS.reports_openai_model)
CLAUDE_EXCEL_ANALYZER = ClaudeExcelAnalyzer(ANTHROPIC_CLIENT)

GPT_TABLE_ANALYZER = TableAnalyzerImpl(GPT_EXCEL_ANALYZER, GPT_SHEET_PROCESSOR)
CLAUDE_TABLE_ANALYZER = TableAnalyzerImpl(CLAUDE_EXCEL_ANALYZER, CLAUDE_SHEET_PROCESSOR)


LONG_FORM_REPORT_SERVICE = ClaudeLongformReportService(ANTHROPIC_CLIENT)
EMBEDDING_SERVICE = OpenAIEmbeddingsService()
VECTOR_SERVICE = PineconeVectorService(
    api_key=SETTINGS.pinecone_api_key,
    environment=SETTINGS.pinecone_env,
    index_name=SETTINGS.pinecone_index,
    namespace=SETTINGS.pinecone_namespace,
)
REPORT_SERVICE = OpenAIReportService(SETTINGS.reports_openai_model)
CHAT_SERVICE = OpenAIChatService()


app.include_router(ChatRouter(CHAT_SERVICE).get_router())
app.include_router(ReportRouter(REPORT_SERVICE, LONG_FORM_REPORT_SERVICE).get_router())
app.include_router(PdfRouter(TABLE_EXTRACTOR, OBJECT_STORE).get_router())
app.include_router(
    TableRouter(GPT_TABLE_ANALYZER, CLAUDE_TABLE_ANALYZER, OBJECT_STORE).get_router()
)
app.include_router(TextRouter().get_router())
app.include_router(VectorRouter(VECTOR_SERVICE).get_router())
app.include_router(EmbeddingsRouter(EMBEDDING_SERVICE).get_router())


@app.get("/ping")
async def ping():
    return {"ping": "ping"}


@app.get("/healthz")
async def healthz():
    return "OK"


@app.middleware("http")
async def secure_svc_to_svc(request: Request, call_next):
    secret = request.headers.get("x-service-to-service-secret")

    if (
        SETTINGS.service_to_service_secret
        and SETTINGS.service_to_service_secret != secret
    ):
        return JSONResponse(status_code=401, content="Not authorized")

    return await call_next(request)


# todo disable reload in prod


def start():
    uvicorn.run(
        "springtime.main:app",
        host=SETTINGS.host,
        port=SETTINGS.port,
        reload=SETTINGS.reload,
    )
