from fastapi import APIRouter
from pydantic import BaseModel
from springtime.excel.table_extractor import TableExtractor


class ExtractTablesRequest(BaseModel):
    bucket: str
    object_path: str
    output_prefix: str
    title: str


class PdfRouter():

    def __init__(self, table_extractor: TableExtractor):
        self.table_extractor = table_extractor

    def get_router(self):

        router = APIRouter(prefix='/pdf')

        @router.post("/extract-tables")
        async def extract_tables(req: ExtractTablesRequest):
            return self.table_extractor.extract(req)

        return router
