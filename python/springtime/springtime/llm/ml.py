from ..settings import SETTINGS

from langchain.prompts import PromptTemplate

from langchain.chains import LLMChain
from langchain.agents import load_tools
from langchain.agents import initialize_agent
from langchain.agents import AgentType

from langchain import OpenAI, ConversationChain

from langchain.chat_models import ChatOpenAI
from langchain.schema import (
    AIMessage,
    HumanMessage,
    SystemMessage
)

from langchain.embeddings import OpenAIEmbeddings


embeddings = OpenAIEmbeddings()
chat = ChatOpenAI(temperature=0)
llm = OpenAI(temperature=0.9)


def embeddings_for_documents(documents: list[str]) -> list[list[float]]:
    return embeddings.embed_documents(documents)


def embedding_for_query(query: str) -> list[float]:
    return embeddings.embed_query(query)


def ask_question(context: str, question: str):
    prompt = PromptTemplate(
        input_variables=["context"],
        template="Given the following context: {context} answer the following question."
    )
    formatted_message = prompt.format(context=context[:3500])
    print("context", context)

    messages = [
        SystemMessage(
            content="You are an expert financial analyst."),
        HumanMessage(
            content=formatted_message),
        HumanMessage(
            content=question),

    ]

    return chat(messages)


def message_completions(input_text: str):
    prompt = PromptTemplate(
        input_variables=["context"],
        template="Given the following context: {context}, what are some interesting, specific questions you would ask the client?"
    )
    formatted_message = prompt.format(context=input_text[:3500])

    messages = [
        SystemMessage(
            content="You are an expert financial analyst that is helping a client make an investment decision"),
        HumanMessage(
            content=formatted_message),

    ]

    return chat(messages)


def summarize(input_text: str):
    prompt = PromptTemplate(
        input_variables=["context"],
        template="Given the following text: {context}, please summarize the text to key points / phrases / ideas. Use a '-' to denote each point."
    )
    formatted_message = prompt.format(context=input_text[:3500])

    messages = [
        SystemMessage(
            content="You are an expert financial analyst that is helping a client make an investment decision"),
        HumanMessage(
            content=formatted_message),

    ]

    return chat(messages)
