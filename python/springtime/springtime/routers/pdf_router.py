import tempfile

from fastapi import APIRouter
from pydantic import BaseModel, NonNegativeInt

from springtime.excel.table_extractor import ExtractionArguments, TableExtractor
from springtime.object_store.object_store import ObjectStore


class ExtractTablesRequest(BaseModel):
    bucket: str
    object_path: str
    output_prefix: str
    title: str


class ExtractTableResponse(BaseModel):
    number_of_sheets: NonNegativeInt
    object_path: str | None


XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


class PdfRouter:
    def __init__(
        self, table_extractor: TableExtractor, object_store: ObjectStore,
    ) -> None:
        self.table_extractor = table_extractor
        self.object_store = object_store

    def get_router(self):
        router = APIRouter(prefix="/pdf")

        @router.post("/extract-tables")
        async def extract_tables(req: ExtractTablesRequest):
            with tempfile.NamedTemporaryFile("wb+") as tmp:
                self.object_store.download_to_filename(
                    req.bucket,
                    req.object_path,
                    tmp.name,
                )

                resp = self.table_extractor.extract(
                    ExtractionArguments(
                        file_name=tmp.name,
                        title=req.title,
                        bucket=req.bucket,
                        output_prefix=req.output_prefix,
                    ),
                )
                return ExtractTableResponse(
                    number_of_sheets=resp.number_of_sheets,
                    object_path=resp.path,
                )

        return router
