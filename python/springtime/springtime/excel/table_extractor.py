import abc
from typing import Optional
import tabula
import pandas as pd


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
    def extract(self, bucket: str, path: str) -> ExtractionResponse:

        pass


class TabulaTableExtractor(TableExtractor):

    def __init__(self, object_store: ObjectStore):
        self.object_store = object_store

    def extract(self, args: ExtractionArguments) -> ExtractionResponse:

        with tempfile.NamedTemporaryFile() as tmp:

            self.object_store.download_to_file(
                args.bucket, args.object_path, tmp.name)

            dfs = tabula.read_pdf(tmp, pages='all')
            if len(dfs) == 0:
                return ExtractionResponse(number_of_sheets=0, object_path=None)
            writer = pd.ExcelWriter(f"{args.title}.xlsx", engine="xlsxwriter")

            for index,  df in enumerate(dfs):
                df.to_excel(writer, sheet_name=f"Sheet {index}",)
            writer.save()

            path = f"{args.output_prefix}/{args.title}.xlsx"
            self.object_store.upload_from_file(
                args.bucket, path, tmp.name)
        return ExtractionResponse(number_of_sheets=len(dfs), object_path=path)
