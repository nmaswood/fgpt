import abc
import json
from typing import Any

import json5
import openai
from loguru import logger
from pydantic import BaseModel

from springtime.models.open_ai import OpenAIModel
from springtime.services.anthropic_client import AnthropicClient
from springtime.services.prompts import questions_schema, terms_schema


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
        completion = openai.ChatCompletion.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert financial analyst AI assistant.",
                },
                {
                    "role": "user",
                    "content": "You will be given a document. Read the document and generate up to ten of the most relevant questions you would want to ask about the data to better understand it for evaluating a potential investment.",
                },
                {
                    "role": "user",
                    "content": """
* Speak in the third person, e.g. do not use "you"
* Do not output the same question twice
* Prefer proper, specific nouns to refer to entities
""",
                },
                {"role": "user", "content": f"Document: {text}"},
            ],
            functions=[{"name": "generate_questions", "parameters": questions_schema}],
            function_call={"name": "generate_questions"},
            temperature=0,
        )
        response = parse_json(completion.choices[0].message.function_call.arguments)
        questions = Questions(**response)
        return [q.question for q in questions.questions]

    def generate_terms(self, text: str) -> list[Term]:
        completion = openai.ChatCompletion.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert financial analyst AI assistant.",
                },
                {
                    "role": "system",
                    "content": "You will be given a document with specificied terms to parse. If the information is not available, do not return anything. Do not output the name of the term, only the value.",
                },
                {"role": "user", "content": f"Document: {text}"},
            ],
            functions=[{"name": "parse_terms", "parameters": terms_schema}],
            function_call={"name": "parse_terms"},
            temperature=0,
        )
        response = json.loads(completion.choices[0].message.function_call.arguments)

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


def parse_json(json_str: str):
    try:
        return json.loads(json_str)
    except Exception as e:
        return json5.loads(json_str)


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
