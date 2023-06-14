from guardrails.utils.pydantic_utils import register_pydantic
from pydantic import BaseModel
from loguru import logger
from retry import retry
import openai
import guardrails as gd
import os


from langchain.embeddings import OpenAIEmbeddings
from springtime.llm.models import ChatHistory

from springtime.llm.prompt import create_prompt


embeddings = OpenAIEmbeddings()


def embeddings_for_documents(documents: list[str]) -> list[list[float]]:
    return embeddings.embed_documents(documents)


def embedding_for_query(query: str) -> list[float]:
    return embeddings.embed_query(query)


def ask_question_streaming(context: str, question: str,
                           history: list[ChatHistory]
                           ):
    prompt = create_prompt(context, question, history)
    response = openai.ChatCompletion.create(
        model='gpt-3.5-turbo',
        messages=[
            {'role': 'user', 'content': prompt}
        ],
        temperature=0,
        stream=True
    )
    for resp in response:
        choices = resp['choices']
        delta = choices[0].get('delta')
        if not delta:
            continue
        content = delta.get('content')
        if content:
            yield content


@retry(tries=3, delay=1, backoff=2)
def ask_question(context: str, question: str):
    prompt = create_prompt(context, question, [])
    formatted_message = prompt.format(
        context=context[:3500], question=question)

    response = openai.ChatCompletion.create(
        # model='gpt-4',
        model='gpt-3.5-turbo',
        messages=[
            {'role': 'user', 'content': formatted_message}
        ],
        temperature=0,
    )
    choices = response["choices"]
    if len(choices) == 0:
        logger.warning("No choices returned from OpenAI")
    first_choice = choices[0]
    return first_choice["message"]["content"]


class Metric(BaseModel):
    description: str
    value: str


@register_pydantic
class Output(BaseModel):
    summaries: list[str] = []
    questions: list[str] = []
    metrics: list[Metric] = []
    entities: list[str] = []


@register_pydantic
class QuestionsAndSummaries(BaseModel):
    summaries: list[str] = []
    questions: list[str] = []


@register_pydantic
class MetricsAndEntities(BaseModel):
    metrics: list[Metric] = []
    entities: list[str] = []


def get_questions_and_summaries(text: str) -> QuestionsAndSummaries:
    dir = os.path.dirname(__file__)
    path = os.path.join(dir, "questions-and-summaries.xml")
    guard = gd.Guard.from_rail(path)

    raw_llm_response, validated_response = guard(
        openai.Completion.create,
        model="text-davinci-003",
        prompt_params={"document": text.replace("gmail", "")},
        max_tokens=512,
        temperature=0,
        num_reasks=2,
    )
    try:
        return QuestionsAndSummaries(**validated_response)
    except Exception as e:
        logger.error(e)
        logger.error(text)
        logger.error(raw_llm_response)
        return QuestionsAndSummaries()


def get_metrics_and_entities(text: str) -> MetricsAndEntities:
    dir = os.path.dirname(__file__)
    path = os.path.join(dir, "metrics-and-entities.xml")
    guard = gd.Guard.from_rail(path)

    raw_llm_response, validated_response = guard(
        openai.Completion.create,
        model="text-davinci-003",
        prompt_params={"document": text.replace("gmail", "")},
        max_tokens=512,
        temperature=0,
        num_reasks=2,
    )
    print(validated_response)
    if not validated_response:
        logger.error("No metrics or entities found")
        return MetricsAndEntities()

    return MetricsAndEntities(**validated_response)


def get_output(text: str) -> Output:
    questions_and_summaries = get_questions_and_summaries(text)
    # metrics_and_entities = get_metrics_and_entities(text)
    metrics_and_entities = MetricsAndEntities()

    return Output(
        summaries=questions_and_summaries.summaries,
        questions=questions_and_summaries.questions,
        metrics=metrics_and_entities.metrics,
        entities=metrics_and_entities.entities,
    )


def from_user(prompt: str, text: str):
    formatted = prompt.replace("{document}", text)
    response = openai.ChatCompletion.create(
        # model='gpt-4',
        model='gpt-3.5-turbo',
        messages=[
            {'role': 'user', 'content': formatted}
        ],
        temperature=0,
    )
    choices = response["choices"]
    if len(choices) == 0:
        logger.warning("No choices returned from OpenAI")
    first_choice = choices[0]
    return first_choice["message"]["content"]
