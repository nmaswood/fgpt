from loguru import logger
from retry import retry
import openai

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
