import abc
from typing import NamedTuple, Optional
import tabula
import os
import pandas as pd
import uuid

import tempfile
from pydantic import BaseModel, NonNegativeInt

from springtime.object_store.object_store import ObjectStore


class ExtractionArguments(BaseModel):
    file_name: str
    title: str
    bucket: str
    output_prefix: str


class ExtractionResponse(NamedTuple):
    number_of_sheets: NonNegativeInt
    xl: Optional[pd.ExcelFile]
    path: Optional[str]


class TableExtractor(abc.ABC):
    @abc.abstractmethod
    def extract(self, args: ExtractionArguments) -> ExtractionResponse:
        pass


XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


class TabulaTableExtractor(TableExtractor):
    def __init__(self, object_store: ObjectStore):
        self.object_store = object_store

    def extract(self, args: ExtractionArguments) -> ExtractionResponse:
        dfs = tabula.read_pdf(args.file_name, pages="all")
        if len(dfs) == 0:
            return ExtractionResponse(number_of_sheets=0, xl=None, path=None)

        with tempfile.TemporaryDirectory() as tmp_dir:
            file_name = os.path.join(tmp_dir, f"{args.title}.xlsx")

            with pd.ExcelWriter(file_name, engine="xlsxwriter") as writer:
                for index, df in enumerate(dfs):
                    df.to_excel(writer, sheet_name=f"Sheet {index}")
            xl = pd.ExcelFile(file_name)

            path = f"{args.output_prefix}/{uuid.uuid4()}.xlsx"
            self.object_store.upload_from_filename(
                args.bucket, path, file_name, content_type=XLSX_MIME_TYPE
            )

        return ExtractionResponse(number_of_sheets=len(dfs), xl=xl, path=path)
