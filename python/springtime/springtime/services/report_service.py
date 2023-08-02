import abc
import json
from typing import Any

import openai
from loguru import logger
from pydantic import BaseModel

from springtime.models.open_ai import OpenAIModel
from springtime.services.anthropic_client import AnthropicClient
from springtime.services.prompts import (
    questions_schema,
    terms_schema,
)


class Question(BaseModel):
    question: str


class Questions(BaseModel):
    questions: list[Question] = []


class Term(BaseModel):
    term_value: str
    term_name: str


class Terms(BaseModel):
    terms: list[Term] = []


class CallFunctionRequest(BaseModel):
    text: str
    prompt: str
    json_schema: dict[str, Any]
    function_name: str


class ReportService(abc.ABC):
    @abc.abstractmethod
    def generate_questions(self, text: str) -> list[str]:
        pass

    @abc.abstractmethod
    def generate_terms(self, text: str) -> list[Term]:
        pass


class OpenAIReportService(ReportService):
    def __init__(self, model: OpenAIModel) -> None:
        self.model = model

    def generate_questions(self, text: str) -> list[str]:
        req = CallFunctionRequest(
            text=text,
            prompt="You are an expert financial analyst. Parse the document for the requested information.",
            json_schema=questions_schema,
            function_name="parse_questions",
        )
        response = self.call_function(req)
        questions = Questions(**response)
        return [q.question for q in questions.questions]

    def generate_terms(self, text: str) -> list[Term]:
        req = CallFunctionRequest(
            text=text,
            prompt="You are an expert financial analyst. Parse the document for the requested information. If the information is not available, do not return anything. Do not output the name of the term, only the value.",
            json_schema=terms_schema,
            function_name="parse_terms",
        )
        response = self.call_function(req)
        terms = [t for t in response["terms"] if "term_value" in t]
        try:
            terms_from_model = Terms(terms=terms)
            return [
                term
                for term in terms_from_model.terms
                if term.term_value != "Not Available"
                and len(term.term_value.strip()) > 0
            ]
        except Exception as e:
            logger.error(e)
            logger.error("Invalid terms parsed")
            return []

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
