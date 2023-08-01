import os
import tempfile
import uuid

from fastapi import APIRouter
from pydantic import BaseModel, NonNegativeInt

from springtime.excel.table_extractor import ExtractionArguments, TableExtractor
from springtime.object_store.object_store import ObjectStore
from springtime.services.thumbnail_service import ThumbnailService


class ExtractTablesRequest(BaseModel):
    bucket: str
    object_path: str
    output_prefix: str
    title: str


class GetThumbnailRequest(BaseModel):
    bucket: str
    object_path: str
    output_prefix: str


class GetThumbailResponse(BaseModel):
    object_path: str


class ExtractTableResponse(BaseModel):
    number_of_sheets: NonNegativeInt
    object_path: str | None


XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


class PdfRouter:
    def __init__(
        self,
        table_extractor: TableExtractor,
        object_store: ObjectStore,
        thumbnail_service: ThumbnailService,
    ) -> None:
        self.table_extractor = table_extractor
        self.object_store = object_store
        self.thumbnail_service = thumbnail_service

    def get_router(self):
        router = APIRouter(prefix="/pdf")

        @router.post("/extract-tables")
        def extract_tables(req: ExtractTablesRequest):
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

        @router.post("/get-thumbnail")
        def get_thumbnail(req: GetThumbnailRequest):
            with tempfile.TemporaryDirectory() as tmp_dir:
                gen_uuid = str(uuid.uuid4())
                file_path = os.path.join(tmp_dir, gen_uuid)
                self.object_store.download_to_filename(
                    req.bucket,
                    req.object_path,
                    file_path,
                )

                resp = self.thumbnail_service.for_pdf(
                    file_path=file_path,
                    output_dir=tmp_dir,
                )

                object_path = os.path.join(req.output_prefix, f"{gen_uuid}.webp")

                self.object_store.upload_from_filename(req.bucket, object_path, resp)

                return GetThumbailResponse(object_path=object_path)

        return router
