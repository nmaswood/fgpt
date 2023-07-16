import tempfile

import pandas as pd
from fastapi import APIRouter
from loguru import logger
from pydantic import BaseModel

from springtime.object_store.object_store import ObjectStore
from springtime.services.analysis_service import AnalysisService, AnalyzeServiceResponse
from springtime.services.table_analyzer import (
    AnalyzeResponseChunk,
    TableAnalyzer,
)


class AnalyzeTableRequest(BaseModel):
    bucket: str
    object_path: str


class AnalyzeTableResponse(BaseModel):
    chunks: list[AnalyzeResponseChunk]


class TableRouter:
    def __init__(
        self,
        gpt_table_analyzer: TableAnalyzer,
        claude_table_analyzer: TableAnalyzer,
        object_store: ObjectStore,
        analysis_service: AnalysisService,
    ) -> None:
        self.gpt_table_analyzer = gpt_table_analyzer
        self.claude_table_analyzer = claude_table_analyzer
        self.object_store = object_store
        self.analysis_service = analysis_service

    def get_router(self):
        router = APIRouter(prefix="/excel")

        @router.post("/analyze-gpt")
        async def analyze_tables_gpt(req: AnalyzeTableRequest) -> AnalyzeTableResponse:
            return self.analyze_table(self.gpt_table_analyzer, req)

        @router.post("/analyze-claude")
        async def analyze_tables_claude(
            req: AnalyzeTableRequest,
        ) -> AnalyzeTableResponse:
            return self.analyze_table(self.claude_table_analyzer, req)

        @router.post("/analyze-code")
        async def analyze_code(
            req: AnalyzeTableRequest,
        ) -> AnalyzeServiceResponse:
            logger.info(f"Analyzing {req.bucket}/{req.object_path}")
            with tempfile.TemporaryDirectory() as tmpdirname:
                file_name = f"{tmpdirname}/file.xlsx"
                self.object_store.download_to_filename(
                    req.bucket,
                    req.object_path,
                    file_name,
                )

                excel_file = pd.ExcelFile(file_name)

                return self.analysis_service.analyze(excel_file=excel_file)

        return router

    def analyze_table(
        self,
        table_analyzer: TableAnalyzer,
        req: AnalyzeTableRequest,
    ) -> AnalyzeTableResponse:
        logger.info(f"Analyzing {req.bucket}/{req.object_path}")
        with tempfile.TemporaryDirectory() as tmpdirname:
            file_name = f"{tmpdirname}/file.xlsx"
            self.object_store.download_to_filename(
                req.bucket,
                req.object_path,
                file_name,
            )

            excel_file = pd.ExcelFile(file_name)

            resp = table_analyzer.analyze(excel_file=excel_file)

            return AnalyzeTableResponse(chunks=resp.chunks)
