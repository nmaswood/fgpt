from typing import Any, Generator
from loguru import logger
import openai

import abc

from springtime.models.chat import ChatHistory


from springtime.services.prompt import create_prompt


class ChatService(abc.ABC):
    @abc.abstractmethod
    def ask_streaming(
        self, context: str, question: str, history: list[ChatHistory]
    ) -> Generator[Any, Any, None]:
        pass

    @abc.abstractmethod
    def ask(self, context: str, question: str) -> str:
        pass


class OpenAIChatService(ChatService):
    def ask_streaming(
        self, context: str, question: str, history: list[ChatHistory]
    ) -> Generator[Any, Any, None]:
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

    def ask(self, context: str, question: str) -> str:
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
