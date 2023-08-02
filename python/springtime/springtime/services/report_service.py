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


class ClaudeReportService(ReportService):
    def __init__(self, client: AnthropicClient) -> None:
        self._client = client

    def generate_questions(self, text: str) -> list[str]:
        prompt = f"""


Human: You are an expert financial analyst AI assistant. I will provide you a document. The document will start after the delimiter _START_DOCUMENT_ and end after the delimiter _END_DOCUMENT_. Based on the document generate the 10 most relevant questions you would want to ask about the data to better understand it for evaluating a potential investment.

* Output each question as an entry in a json array of strings.
* Speak in the third person, e.g. do not use "you"
* Prefer proper, specific nouns to refer to entities

Human: _START_DOCUMENT_{text.strip()}_END_DOCUMENT_


Assistant:"""
        raw = self._client.complete(
            prompt,
        ).strip()

        start_index = raw.find("[")
        value = raw[start_index:]

        try:
            return json.loads(value)
        except Exception as e:
            logger.error(e)
            logger.error(value)
            logger.error(raw)
            logger.error("Claude response for questions failed")
            return []

    def generate_terms(self, text: str) -> list[Term]:
        prompt = f"""


Human: You are an expert financial analyst AI assistant. I will provide you a document. The document will start after the delimiter _START_DOCUMENT_ and end after the delimiter _END_DOCUMENT_. From the document try to parse the following:

Company Overview

Company Description

Company Industry

Document Overview

Document Name

Document Date

Lead Arranger

Most Recent Revenue

Most Recent Full Year EBITDA

Most Recent Full Year Net Income

* Output each term as an entry in a json array of strings. Put the term name on the left and the term value on the right with a "|" separating the two. e.g. "Document Name | Investment Document January"

* Do not output anything else
* If you cannot find a term in the document output "Not provided" for that term. For example "Most Recent Full Year EBITDA | Not provided"


Human: _START_DOCUMENT_{text.strip()}_END_DOCUMENT_


Assistant:"""

        raw = self._client.complete(
            prompt,
        ).strip()

        start_index = raw.find("[")
        value = raw[start_index:]

        try:
            parsed = json.loads(value)
            terms = [parse_term(term) for term in parsed]
            return [term for term in terms if term is not None]
        except Exception as e:
            logger.error(e)
            logger.error(value)
            logger.error(raw)
            logger.error("Claude response for terms failed")
            return []


def parse_term(value: str) -> Term | None:
    splat = value.split("|", 1)
    if len(splat) != 2:
        return None
    left, right = splat
    left = left.strip()
    right = right.strip()
    if right == "Not provided":
        return None
    return Term(term_name=left, term_value=right)
