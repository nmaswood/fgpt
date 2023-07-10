import abc

from springtime.services.anthropic_client import AnthropicClient


class LongformReportService(abc.ABC):
    @abc.abstractmethod
    def generate(self, text: str) -> str:
        pass


BASE_PROMPT = (
    "You are an expert financial analyst. Your job is to review materials and evaluate whether it might be a good investment for the PE fund you are supporting."
    "Provide the key investment merits, investment risks, financial summary and transaction details in well formatted summary memo"
)


class ClaudeLongformReportService(LongformReportService):
    def __init__(self, client: AnthropicClient) -> None:
        self._client = client

    def generate(self, text: str) -> str:
        prompt = f"""
                {BASE_PROMPT}
                Document:
                {text}
                """

        return self._client.complete(prompt)
