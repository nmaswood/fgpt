import tiktoken

from springtime.services.anthropic_client import AnthropicClient


class TokenLengthService:
    def __init__(self, anthropic: AnthropicClient) -> None:
        self.anthropic = anthropic
        self.enc_gpt4 = tiktoken.encoding_for_model("gpt-4")

    def gpt4(self, text: str):
        return len(self.enc_gpt4.encode(text))

    def claude100k(self, text: str):
        return self.anthropic.count_tokens(text)
