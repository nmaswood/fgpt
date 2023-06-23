import abc
from typing import Optional
import tabula
import os
import pandas as pd
import uuid

import tempfile
from pydantic import BaseModel, NonNegativeInt

from springtime.object_store.object_store import ObjectStore


class ExtractionArguments(BaseModel):
    bucket: str
    object_path: str
    output_prefix: str
    title: str


class ExtractionResponse(BaseModel):
    number_of_sheets: NonNegativeInt
    object_path: Optional[str]


class TableExtractor(abc.ABC):
    @abc.abstractmethod
    def extract(self, args: ExtractionArguments) -> ExtractionResponse:
        pass


XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


class TabulaTableExtractor(TableExtractor):
    def __init__(self, object_store: ObjectStore):
        self.object_store = object_store

    def extract(self, args: ExtractionArguments) -> ExtractionResponse:
        with tempfile.NamedTemporaryFile("wb+") as tmp:
            self.object_store.download_to_filename(
                args.bucket, args.object_path, tmp.name
            )

            dfs = tabula.read_pdf(tmp, pages="all")
            if len(dfs) == 0:
                return ExtractionResponse(number_of_sheets=0, object_path=None)

        with tempfile.TemporaryDirectory() as tmp_dir:
            file_name = os.path.join(tmp_dir, f"{args.title}.xlsx")

            with pd.ExcelWriter(file_name, engine="xlsxwriter") as writer:
                for index, df in enumerate(dfs):
                    df.to_excel(writer, sheet_name=f"Sheet {index}")
            path = f"{args.output_prefix}/{uuid.uuid4()}.xlsx"
            self.object_store.upload_from_filename(
                args.bucket, path, file_name, content_type=XLSX_MIME_TYPE
            )
        return ExtractionResponse(number_of_sheets=len(dfs), object_path=path)
