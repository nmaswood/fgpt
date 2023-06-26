from typing import Any
from pydantic import BaseModel
from loguru import logger
from retry import retry
import openai

import json

from langchain.embeddings import OpenAIEmbeddings
from springtime.llm.models import ChatHistory

from springtime.llm.prompt import create_prompt
from springtime.llm.prompts import (
    questions_schema,
    summaries_schema,
    terms_schema,
    financial_summary_schema,
)


embeddings = OpenAIEmbeddings()


def embeddings_for_documents(documents: list[str]) -> list[list[float]]:
    return embeddings.embed_documents(documents)


def embedding_for_query(query: str) -> list[float]:
    return embeddings.embed_query(query)


def ask_question_streaming(context: str, question: str, history: list[ChatHistory]):
    prompt = create_prompt(context, question, history)
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        stream=True,
    )
    for resp in response:
        choices = resp["choices"]
        delta = choices[0].get("delta")
        if not delta:
            continue
        content = delta.get("content")
        if content:
            yield content


@retry(tries=3, delay=1, backoff=2)
def ask_question(context: str, question: str):
    prompt = create_prompt(context, question, [])
    formatted_message = prompt.format(context=context, question=question)

    response = openai.ChatCompletion.create(
        # model='gpt-4',
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": formatted_message}],
        temperature=0,
    )
    choices = response["choices"]
    if len(choices) == 0:
        logger.warning("No choices returned from OpenAI")
    first_choice = choices[0]
    return first_choice["message"]["content"]


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


def get_questions(text: str) -> list[str]:
    req = PlaygroundRequest(
        text=text,
        prompt="You are an expert financial analyst. Parse the document for the requested information.",
        json_schema=questions_schema,
        function_name="parse_questions",
    )
    response = call_function(req)
    questions = Questions(**response)
    return [q.question for q in questions.questions]


def get_fin_summary(text: str) -> FinancialSummary:
    req = PlaygroundRequest(
        text=text,
        prompt="You are an expert financial analyst. Parse the document for the requested information. If the information is not available, do not return anything.",
        json_schema=financial_summary_schema,
        function_name="parse_financial_summary",
    )
    response = call_function(req)
    try:
        return FinancialSummary(**response)
    except Exception as e:
        logger.error(e)
        return FinancialSummary()


def get_terms(text: str) -> list[Term]:
    req = PlaygroundRequest(
        text=text,
        prompt="You are an expert financial analyst. Parse the document for the requested information. If the information is not available, return 'Not Available'",
        json_schema=terms_schema,
        function_name="parse_terms",
    )
    response = call_function(req)
    terms_from_model = Terms(**response)
    terms = [
        term for term in terms_from_model.terms if term.term_value != "Not Available"
    ]
    return terms


def get_summaries(text: str) -> list[str]:
    req = PlaygroundRequest(
        text=text,
        prompt="You are an expert financial analyst. Parse the document for the requested information",
        json_schema=summaries_schema,
        function_name="parse_summaries",
    )
    response = call_function(req)
    summaries = Summaries(**response)
    return summaries.summaries


def get_output(text: str) -> Output:
    questions = get_questions(text)
    summaries = get_summaries(text)
    terms = get_terms(text)
    fin_summary = get_fin_summary(text)

    return Output(
        summaries=summaries,
        questions=questions,
        terms=terms,
        financial_summary=fin_summary,
    )


def call_function(req: PlaygroundRequest) -> dict[str, Any]:
    print("Running request")
    completion = openai.ChatCompletion.create(
        model="gpt-4-0613",
        # model='gpt-3.5-turbo-16k-0613'
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
