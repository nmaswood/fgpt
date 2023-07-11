import abc

from springtime.services.anthropic_client import AnthropicClient


class LongformReportService(abc.ABC):
    @abc.abstractmethod
    def generate(self, text: str) -> str:
        pass


BASE_PROMPT = (
    "You are an expert financial analyst. Your job is to review materials and evaluate whether it might be a good investment for the PE fund you are supporting."
    "I will provide you a document after you answer OK. The document start after _START_DOCUMENT_ and end after _END_DOCUMENT_.  Read the document and provide key investment merits, investment risks, financial summary and transaction details from the document"
)


class ClaudeLongformReportService(LongformReportService):
    def __init__(self, client: AnthropicClient) -> None:
        self._client = client

    def generate(self, text: str) -> str:
        prompt = f"""


Human: {BASE_PROMPT}


Assistant: OK


Human: _START_DOCUMENT_{text.strip()}_END_DOCUMENT_


Assistant:"""
        return self._client.complete(prompt)
