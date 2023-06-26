import abc

import pandas as pd
import openai
from pydantic.types import NonNegativeInt
import json
from typing import Optional
from pydantic import BaseModel, Field
from enum import Enum


fileF = "/Users/nasrmaswood/Downloads/a67dcd5a9291725043156526b2ad89f7.xlsx"


class DataType(str, Enum):
    string = "string"
    integer = "integer"
    monetary_amount = "monetary_amount"
    unknown = "unknown"
    other = "other"


class Column(BaseModel):
    type: DataType = Field(
        description='The type of the column. One of "string", "integer", "monetary_amount", "other" or "unknown".'
    )
    description: Optional[str] = Field(description="A description of the column.")
    name: Optional[str] = Field(description="The name of the column header.")


class Table(BaseModel):
    """
    This is the description of the main model
    """

    columns: list[Column] = Field(description="The columns of the table, in order.")
    description: Optional[str] = Field(description="A description of the table.")


class AnalyzeArguments(BaseModel):
    excel_file: pd.ExcelFile
    sheet_number: NonNegativeInt

    class Config:
        arbitrary_types_allowed = True


class AnalyzeResponse(BaseModel):
    table: Table


TABLE_SCHEMA = Table.schema()


class TableAnalyzer(abc.ABC):
    @abc.abstractmethod
    def analyze(
        self, *, excel_file: pd.ExcelFile, sheet_number: int
    ) -> AnalyzeResponse:
        pass

        return None


class TableAnalyzerImpl(TableAnalyzer):
    def __init__(self):
        pass

    def analyze(
        self, *, excel_file: pd.ExcelFile, sheet_number: int
    ) -> AnalyzeResponse:
        xl = pd.ExcelFile(fileF)
        sheet = xl.sheet_names[sheet_number]
        parsed_sheet = xl.parse(sheet)
        as_string = parsed_sheet.to_string()
        return AnalyzeResponse(table=self._execute(as_string))

    def _execute(self, table: str):
        completion = openai.ChatCompletion.create(
            model="gpt-4-0613",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert financial analyst. You are being given a tabular data from a financial document. Try your best to answer the questions provided",
                },
                {"role": "user", "content": "Table: {}".format(table)},
            ],
            functions=[{"name": "parse_table", "parameters": TABLE_SCHEMA}],
            function_call={"name": "parse_table"},
            temperature=0,
        )
        res = completion.choices[0].message.function_call.arguments

        return Table(**json.loads(res))
