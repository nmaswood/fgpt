from typing import Any, Generator

from pydantic import BaseModel

import abc
from loguru import logger
import openai

import json


from springtime.llm.prompts import (
    questions_schema,
    summaries_schema,
    terms_schema,
    financial_summary_schema,
)


class Question(BaseModel):
    question: str


class Questions(BaseModel):
    questions: list[Question] = []


class FinancialSummary(BaseModel):
    investment_merits: list[str] = []
    investment_risks: list[str] = []
    financial_summaries: list[str] = []


class Term(BaseModel):
    term_value: str
    term_name: str


class Terms(BaseModel):
    terms: list[Term] = []


class Output(BaseModel):
    summaries: list[str] = []
    questions: list[str] = []
    terms: list[Term] = []
    financial_summary: FinancialSummary


class Summaries(BaseModel):
    summaries: list[str] = []


class PlaygroundRequest(BaseModel):
    text: str
    prompt: str
    json_schema: dict[str, Any]
    function_name: str


class ReportService(abc.ABC):
    @abc.abstractmethod
    def generate_output(self, text: str) -> Generator[Any, Any, None]:
        pass


class OpenAIReportService(abc.ABC):
    def get_output(self, text: str) -> Output:
        questions = self.get_questions(text)
        summaries = self.get_summaries(text)
        terms = self.get_terms(text)
        fin_summary = self.get_fin_summary(text)

        return Output(
            summaries=summaries,
            questions=questions,
            terms=terms,
            financial_summary=fin_summary,
        )

    def get_questions(self, text: str) -> list[str]:
        req = PlaygroundRequest(
            text=text,
            prompt="You are an expert financial analyst. Parse the document for the requested information.",
            json_schema=questions_schema,
            function_name="parse_questions",
        )
        response = self.call_function(req)
        questions = Questions(**response)
        return [q.question for q in questions.questions]

    def get_fin_summary(self, text: str) -> FinancialSummary:
        req = PlaygroundRequest(
            text=text,
            prompt="You are an expert financial analyst. Parse the document for the requested information. If the information is not available, do not return anything.",
            json_schema=financial_summary_schema,
            function_name="parse_financial_summary",
        )
        response = self.call_function(req)
        try:
            return FinancialSummary(**response)
        except Exception as e:
            logger.error(e)
            return FinancialSummary()

    def get_terms(self, text: str) -> list[Term]:
        req = PlaygroundRequest(
            text=text,
            prompt="You are an expert financial analyst. Parse the document for the requested information. If the information is not available, return 'Not Available'",
            json_schema=terms_schema,
            function_name="parse_terms",
        )
        response = self.call_function(req)
        terms_from_model = Terms(**response)
        terms = [
            term
            for term in terms_from_model.terms
            if term.term_value != "Not Available"
        ]
        return terms

    def get_summaries(self, text: str) -> list[str]:
        req = PlaygroundRequest(
            text=text,
            prompt="You are an expert financial analyst. Parse the document for the requested information",
            json_schema=summaries_schema,
            function_name="parse_summaries",
        )
        response = self.call_function(req)
        summaries = Summaries(**response)
        return summaries.summaries

    def call_function(self, req: PlaygroundRequest) -> dict[str, Any]:
        print("Running request")
        completion = openai.ChatCompletion.create(
            model="gpt-4-0613",
            messages=[
                {"role": "system", "content": req.prompt},
                {"role": "user", "content": "Document: {}".format(req.text)},
            ],
            functions=[{"name": req.function_name, "parameters": req.json_schema}],
            function_call={"name": req.function_name},
            temperature=0,
        )

        res = completion.choices[0].message.function_call.arguments

        return json.loads(res)
