from asyncio import streams
from ..settings import SETTINGS

from langchain.prompts import PromptTemplate

from langchain.chains import LLMChain
from langchain.agents import load_tools
from langchain.agents import initialize_agent
from langchain.agents import AgentType
import openai

from langchain import OpenAI, ConversationChain

from langchain.chat_models import ChatOpenAI
from langchain.schema import (
    AIMessage,
    HumanMessage,
    SystemMessage
)

from langchain.embeddings import OpenAIEmbeddings


embeddings = OpenAIEmbeddings()
chat = ChatOpenAI(temperature=0, streaming=True)


def embeddings_for_documents(documents: list[str]) -> list[list[float]]:
    return embeddings.embed_documents(documents)


def embedding_for_query(query: str) -> list[float]:
    return embeddings.embed_query(query)


def ask_question(context: str, question: str):

    prompt = PromptTemplate(
        input_variables=["context", "question"],
        template="You are an expert financial analyst. Given the following context: {context} answer the following question.\nQuestion:{question}",
    )
    formatted_message = prompt.format(
        context=context[:3500], question=question)

    response = openai.ChatCompletion.create(
        model='gpt-4',
        messages=[
            {'role': 'user', 'content': formatted_message}
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
