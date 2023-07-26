import abc
from collections.abc import Generator
from typing import Any

import openai
from loguru import logger

from springtime.models.chat import ChatFileContext, ChatHistory
from springtime.services.prompt import create_prompt


class ChatService(abc.ABC):
    @abc.abstractmethod
    def ask_streaming(
        self,
        context: list[ChatFileContext],
        question: str,
        history: list[ChatHistory],
    ) -> Generator[Any, Any, None]:
        pass

    @abc.abstractmethod
    def get_title(self, question: str, answer: str) -> str:
        pass


MODEL = "gpt-3.5-turbo"


class OpenAIChatService(ChatService):
    def ask_streaming(
        self,
        context: list[ChatFileContext],
        question: str,
        history: list[ChatHistory],
    ) -> Generator[Any, Any, None]:
        prompt = create_prompt(context, question, history)
        response = openai.ChatCompletion.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "You are an expert financial analyst."},
                {
                    "role": "system",
                    "content": "Output your format in an easy to read format, for example for list responses use bullet points and place line breaks in the appropriate locations.",
                },
                {"role": "user", "content": prompt},
            ],
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

    def get_title(self, question: str, answer: str) -> Generator[Any, Any, None]:
        prompt = f"""
        Based on the question and answer please respond with a concise, accurate title for the exchange.
        Do not output anything except the title itself. Try to limit your response to at most five words.

        Question: {question}
        Answer: {answer}
        """.format(
            question=question,
            answer=answer,
        )
        response = openai.ChatCompletion.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert financial analyst chat bot. The user asked you the following question and you responded with the following answer.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0,
        )

        choices = response["choices"]
        if len(choices) == 0:
            logger.warning("No choices returned from OpenAI")
        first_choice = choices[0]
        return first_choice["message"]["content"]
