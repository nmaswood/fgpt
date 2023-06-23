from fastapi import APIRouter
from springtime.excel.table_extractor import TableExtractor


class PdfRouter():

    def __init__(self, table_extractor: TableExtractor):
        pass

    def get_router(self):

        router = APIRouter(prefix='/pdf')

        @router.post("/extract-tables")
        async def extract_tables():
            return {"ping": "pong"}

        return router
