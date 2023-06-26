from fastapi import APIRouter
from pydantic import BaseModel, NonNegativeInt
from springtime.llm.table_analyzer import TableAnalyzer, Table
from springtime.object_store.object_store import ObjectStore
import tempfile
import pandas as pd


class AnalyzeTableRequest(BaseModel):
    sheet_numbers: list[NonNegativeInt]
    bucket: str
    object_path: str


class AnalyzeTableResponse(BaseModel):
    resp: dict[NonNegativeInt, Table]


class TableRouter:
    def __init__(self, table_analyzer: TableAnalyzer, object_store: ObjectStore):
        self.table_analyzer = table_analyzer
        self.object_store = object_store

    def get_router(self):
        router = APIRouter(prefix="/excel")

        @router.post("/analyze")
        async def analyze_tables(req: AnalyzeTableRequest) -> AnalyzeTableResponse:
            results: dict[NonNegativeInt, Table] = {}

            with tempfile.TemporaryDirectory() as tmpdirname:
                file_name = f"{tmpdirname}/file.xlsx"
                self.object_store.download_to_filename(
                    req.bucket, req.object_path, file_name
                )

                excel_file = pd.ExcelFile(file_name)

                for sheet_number in req.sheet_numbers:
                    results[sheet_number] = self.table_analyzer.analyze(
                        excel_file=excel_file, sheet_number=sheet_number
                    ).table
            return AnalyzeTableResponse(resp=results)

        return router
