import abc

import openai
from pydantic import BaseModel

from springtime.models.open_ai import CompletionResponse, OpenAIModel
from springtime.services.anthropic_client import AnthropicClient
from springtime.services.format_sheet import format_sheet
from springtime.services.html import html_from_text
from springtime.services.prompts import CLAUDE_PROMPT, GPT_PROMPT
from springtime.services.sheet_processor import PreprocessedSheet


class ResponseWithPrompt(BaseModel):
    prompt: str
    content: str
    sanitized_html: str | None


class ExcelAnalyzer(abc.ABC):
    @abc.abstractmethod
    def analyze(self, *, sheets: list[PreprocessedSheet]) -> ResponseWithPrompt:
        pass


class OpenAIExcelAnalyzer(ExcelAnalyzer):
    def __init__(self, model: OpenAIModel) -> None:
        self.model = model

    def analyze(self, *, sheets: list[PreprocessedSheet]) -> ResponseWithPrompt:
        table_content = "\n---\n".join([format_sheet(sheet) for sheet in sheets])
        response = self._chat_completion(table_content)

        content = response.choices[0].message.content

        return ResponseWithPrompt(
            prompt=table_content,
            content=content,
            sanitized_html=html_from_text(content),
        )

    def _chat_completion(self, table: str) -> CompletionResponse:
        completion = openai.ChatCompletion.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": GPT_PROMPT,
                },
                {"role": "user", "content": table},
            ],
            temperature=0,
        )
        return CompletionResponse(**completion)


class ClaudeExcelAnalyzer(ExcelAnalyzer):
    def __init__(self, anthropic_client: AnthropicClient) -> None:
        self.anthropic_client = anthropic_client

    def analyze(self, *, sheets: list[PreprocessedSheet]) -> ResponseWithPrompt:
        table_content = "\n---\n".join([format_sheet(sheet) for sheet in sheets])
        prompt = f"""


Human: {CLAUDE_PROMPT}

__START_DATA__
{table_content}
__END_DATA__


Assistant:
"""
        content = self.anthropic_client.complete(prompt=prompt).strip()
        return ResponseWithPrompt(
            prompt=prompt,
            content=content,
            sanitized_html=html_from_text(content),
        )
