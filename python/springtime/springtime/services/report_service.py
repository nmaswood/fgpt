import abc
import json
import time

import json5
import openai
from loguru import logger
from pydantic import BaseModel

from springtime.models.open_ai import OpenAIModel
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


class Page(BaseModel):
    order: int
    terms: list[Term] = []


class ReportService(abc.ABC):
    @abc.abstractmethod
    def generate_questions_for_text(self, text: str) -> list[str]:
        pass

    @abc.abstractmethod
    def generate_terms(self, text: str) -> list[Term]:
        pass


class OpenAIReportService(ReportService):
    def __init__(
        self,
        model: OpenAIModel,
    ) -> None:
        self.model = model

    def generate_questions_for_text(self, text: str) -> list[str]:
        for _attempt in range(3):
            try:
                return self._generate_questions_for_text(text)
            except openai.error.RateLimitError as e:
                logger.error(e)
                logger.error("OpenAI response for questions failed")
                logger.error("Sleeping for 10 seconds")
                time.sleep(10)
        msg = "OpenAI response for questions failed"
        raise Exception(msg)

    def _generate_questions_for_text(self, text: str) -> list[str]:
        completion = openai.ChatCompletion.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert financial analyst AI assistant.",
                },
                {
                    "role": "user",
                    "content": "You will be given a document. Read the document and generate the top 3 most relevant questions you would want to ask about the data to better understand it for evaluating a potential investment.",
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
        for _attempt in range(3):
            try:
                return self._generate_terms(text)
            except openai.error.RateLimitError as e:
                logger.error(e)
                logger.error("OpenAI response for questions failed")
                logger.error("Sleeping for 10 seconds")
                time.sleep(10)
        msg = "OpenAI response for terms failed"
        raise Exception(msg)

    def _generate_terms(self, text: str) -> list[Term]:
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
                if term.term_value.lower() not in IGNORE
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


IGNORE = {
    "not provided",
    "not available",
    "not specified",
    "not provided in the document",
    "n/a",
}


def parse_term(value: str) -> Term | None:
    splat = value.split("|", 1)
    if len(splat) != 2:
        return None
    left, right = splat
    left = left.strip()
    right = right.strip()
    if right.lower() in IGNORE:
        return None
    return Term(term_name=left, term_value=right)
