import abc

import bleach
import markdown
import pydantic
from loguru import logger

from springtime.services.anthropic_client import AnthropicClient
from springtime.services.html import html_from_text


class LongformReport(pydantic.BaseModel):
    raw: str
    sanitized_html: str | None


class LongformReportService(abc.ABC):
    @abc.abstractmethod
    def generate(self, text: str) -> LongformReport:
        pass


BASE_PROMPT = (
    "You are an expert financial analyst. Your job is to review materials and evaluate whether it might be a good investment for the PE fund you are supporting."
    "I will provide you a document after you answer OK. The document start after _START_DOCUMENT_ and end after _END_DOCUMENT_.  Read the document and provide key investment merits, investment risks, financial summary and transaction details from the document."
    "Please output unrendered markdown. Headers should be designated with #. Do not speak in the first person. Do not output anything except the report."
)


class ClaudeLongformReportService(LongformReportService):
    def __init__(self, client: AnthropicClient) -> None:
        self._client = client

    def generate(self, text: str) -> LongformReport:
        prompt = f"""


Human: {BASE_PROMPT}


Assistant: OK


Human: _START_DOCUMENT_{text.strip()}_END_DOCUMENT_


Assistant:"""
        raw = self._client.complete(
            prompt,
        ).strip()
        sanitized_html = html_from_text(raw)
        return LongformReport(
            raw=raw,
            sanitized_html=sanitized_html,
        )
