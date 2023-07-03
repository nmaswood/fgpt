from fastapi import APIRouter
from loguru import logger
from pydantic import BaseModel
from springtime.services.table_analyzer import AnalyzeResponseChunk, TableAnalyzer
from springtime.object_store.object_store import ObjectStore
import tempfile
import pandas as pd


class AnalyzeTableRequest(BaseModel):
    bucket: str
    object_path: str


class AnalyzeTableResponse(BaseModel):
    chunks: list[AnalyzeResponseChunk]


class TableRouter:
    def __init__(self, table_analyzer: TableAnalyzer, object_store: ObjectStore):
        self.table_analyzer = table_analyzer
        self.object_store = object_store

    def get_router(self):
        router = APIRouter(prefix="/excel")

        @router.post("/analyze")
        async def analyze_tables(req: AnalyzeTableRequest) -> AnalyzeTableResponse:
            logger.info(f"Analyzing {req.bucket}/{req.object_path}")
            with tempfile.TemporaryDirectory() as tmpdirname:
                file_name = f"{tmpdirname}/file.xlsx"
                self.object_store.download_to_filename(
                    req.bucket, req.object_path, file_name
                )

                excel_file = pd.ExcelFile(file_name)

                resp = self.table_analyzer.analyze(excel_file=excel_file)

                return AnalyzeTableResponse(chunks=resp.chunks)

        return router
