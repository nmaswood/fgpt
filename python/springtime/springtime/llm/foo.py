from ..settings import SETTINGS
from langchain.llms import OpenAI

from langchain.prompts import PromptTemplate

from langchain.chains import LLMChain
from langchain.agents import load_tools
from langchain.agents import initialize_agent
from langchain.agents import AgentType
from langchain.llms import OpenAI

from langchain import OpenAI, ConversationChain

from langchain.chat_models import ChatOpenAI
from langchain.schema import (
    AIMessage,
    HumanMessage,
    SystemMessage
)

chat = ChatOpenAI(temperature=0)


llm = OpenAI(temperature=0.9)


def play(n: int) -> int:
    text = "What would be a good company name for a company that makes colorful socks?"

    prompt = PromptTemplate(
        input_variables=["product"],
        template="What is a good name for a company that makes {product}?",
    )
    chain = LLMChain(llm=llm, prompt=prompt)
    tools = load_tools(["serpapi", "llm-math"], llm=llm)
    agent = initialize_agent(
        tools, llm, verbose=True)


# Now let's test it out!
    agent.run("What was the high temperature in SF yesterday in Fahrenheit? What is that number raised to the .023 power?")

    return n + 1


def conversation_chain():
    llm = OpenAI(temperature=0)
    conversation = ConversationChain(llm=llm, verbose=True)

    output = conversation.predict(input="Hi there!")
    print(output)
    output = conversation.predict(
        input="I'm doing well! Just having a conversation with an AI.")
    print(output)
    output = conversation.predict(
        input="My name is Nasr remember it.")
    print(output)
    output = conversation.predict(
        input="What is my name?")
    print(output)


def message_completions(input_text: str):
    chat = ChatOpenAI(temperature=0)
    prompt = PromptTemplate(
        input_variables=["context"],
        template="Given the following context: {context}, what are some interesting questions you would ask the client?"
    )
    formatted_message = prompt.format(context=input_text[:3500])

    messages = [
        SystemMessage(
            content="You are an expert financial analyst that is helping a client make an investment decision"),
        HumanMessage(
            content=formatted_message),

    ]

    return chat(messages)
