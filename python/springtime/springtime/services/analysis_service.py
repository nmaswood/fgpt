import abc
import ast
import json

import openai
import pandas as pd
from loguru import logger
from pydantic import BaseModel, Field

from springtime.models.open_ai import OpenAIModel
from springtime.services.format_sheet import format_sheet
from springtime.services.sheet_processor import (
    PreprocessedSheet,
    SheetPreprocessor,
)

CODE_DESCRIPTION = """Expert, bug-free python code that utilizes pandas to perform accurate financial data analysis on the given data.
""".strip()


class CodeOutput(BaseModel):
    description: str = Field(
        description="description of the code output and the analysis",
    )
    code: str = Field(description=CODE_DESCRIPTION)


SCHEMA = CodeOutput.schema()


class AnalyzeArguments(BaseModel):
    excel_file: pd.ExcelFile

    class Config:
        arbitrary_types_allowed = True


class ResponseChunk(BaseModel):
    parsable: bool
    content: CodeOutput
    prompt: str
    sheet_names: list[str]


class AnalyzeServiceResponse(BaseModel):
    chunks: list[ResponseChunk]


class AnalysisService(abc.ABC):
    @abc.abstractmethod
    def analyze(self, *, excel_file: pd.ExcelFile) -> AnalyzeServiceResponse:
        return None


GPT4_TOKEN_LIMIT = 5000

PROMPT = """
You are supporting a private equity fund in the evaluation of various financial investments. Your job is to review materials and help evaluate whether it might be a good investment for the PE fund you are supporting.

You provide thorough, accurate financial analysis and insights that will be useful to inform an investment on a given company or security.

First, identify what the data is

If you are given data, you analyze it fully, find trends and potential outliers, and decide what is the best analysis to run given the data or context provided.

You will be given data extracted from an excel file and you will be asked to analyze it using python and pandas.

Each sheet will have the sheet name and the sheet data in the following format:

Sheet name: <sheet name>
Sheet content: <sheet data>

Seperate sheets will be delimited by '\n___\n'

* Data will be available in the local file system at the path data.xlsx
* Do not initialize the pandas dataframes with parsed data instead access data by referring to data by its sheet name

If you cannot analyze the sheet data as given do not output any code. If possible provide a reason why you cannot analyze the data.
""".strip()


class GPTAnalysisService(AnalysisService):
    def __init__(self, sheet_processor: SheetPreprocessor, model: OpenAIModel) -> None:
        self.sheet_preprocessor = sheet_processor
        self.model = model

    def analyze(self, *, excel_file: pd.ExcelFile) -> AnalyzeServiceResponse:
        acc: list[ResponseChunk] = []

        xl = pd.ExcelFile(excel_file)
        preprocessed = self.sheet_preprocessor.preprocess(xl=xl)
        chunks = self.sheet_preprocessor.chunk(preprocessed)

        logger.info(f"{len(chunks)} Chunks being analyzed")
        for sheet_chunk in chunks.sheets:
            sheet_names = ", ".join(sheet.sheet_name for sheet in sheet_chunk)
            logger.info(f"Starting to analyze sheet chunks: {sheet_names}")

            resp = self._analyze(sheet_chunk)

            acc.append(resp)

            logger.info(f"Finished analyzing sheet chunk: {sheet_names}")

        return AnalyzeServiceResponse(chunks=acc)

    def _analyze(self, sheets: list[PreprocessedSheet]) -> ResponseChunk:
        table_content = "\n---\n".join([format_sheet(sheet) for sheet in sheets])

        completion = openai.ChatCompletion.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": PROMPT,
                },
                {"role": "user", "content": table_content},
            ],
            functions=[{"name": "analyze_data", "parameters": SCHEMA}],
            function_call={"name": "analyze_data"},
            temperature=0,
        )

        res = completion.choices[0].message.function_call.arguments

        as_json = json.loads(res)

        content = CodeOutput(**as_json)
        parsable = False

        try:
            ast.parse(content.code)
            parsable = True
        except SyntaxError:
            pass

        return ResponseChunk(
            parsable=parsable,
            content=content,
            prompt=table_content,
            sheet_names=[sheet.sheet_name for sheet in sheets],
        )
