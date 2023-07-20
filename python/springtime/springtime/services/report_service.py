import abc
import json
from typing import Any

import openai
from loguru import logger
from pydantic import BaseModel

from springtime.models.open_ai import OpenAIModel
from springtime.services.prompts import (
    financial_summary_schema,
    questions_schema,
    summaries_schema,
    terms_schema,
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


class CallFunctionRequest(BaseModel):
    text: str
    prompt: str
    json_schema: dict[str, Any]
    function_name: str


class ReportService(abc.ABC):
    @abc.abstractmethod
    def generate_output(self, text: str) -> Output:
        pass


class OpenAIReportService(ReportService):
    def __init__(self, model: OpenAIModel) -> None:
        self.model = model

    def generate_output(self, text: str) -> Output:
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
        req = CallFunctionRequest(
            text=text,
            prompt="You are an expert financial analyst. Parse the document for the requested information.",
            json_schema=questions_schema,
            function_name="parse_questions",
        )
        response = self.call_function(req)
        questions = Questions(**response)
        return [q.question for q in questions.questions]

    def get_fin_summary(self, text: str) -> FinancialSummary:
        req = CallFunctionRequest(
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
        req = CallFunctionRequest(
            text=text,
            prompt="You are an expert financial analyst. Parse the document for the requested information. If the information is not available, do not return anything. Do not output the name of the term, only the value.",
            json_schema=terms_schema,
            function_name="parse_terms",
        )
        response = self.call_function(req)
        terms = [t for t in response["terms"] if "term_value" in t]
        terms_from_model = Terms(terms=terms)
        return [
            term
            for term in terms_from_model.terms
            if term.term_value != "Not Available" and len(term.term_value.strip()) > 0
        ]

    def get_summaries(self, text: str) -> list[str]:
        req = CallFunctionRequest(
            text=text,
            prompt="You are an expert financial analyst. Parse the document for the requested information",
            json_schema=summaries_schema,
            function_name="parse_summaries",
        )
        response = self.call_function(req)
        summaries = Summaries(**response)
        return summaries.summaries

    def call_function(self, req: CallFunctionRequest) -> dict[str, Any]:
        logger.info(f"Running function {req.function_name}")
        completion = openai.ChatCompletion.create(
            model=self.model,
            messages=[
                {"role": "system", "content": req.prompt},
                {"role": "user", "content": f"Document: {req.text}"},
            ],
            functions=[{"name": req.function_name, "parameters": req.json_schema}],
            function_call={"name": req.function_name},
            temperature=0,
        )
        res = completion.choices[0].message.function_call.arguments

        return json.loads(res)
