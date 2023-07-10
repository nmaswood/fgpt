from anthropic import Anthropic


class AnthropicClient:
    def __init__(self):
        self._anthropic = Anthropic()

    def complete(self, prompt: str) -> str:
        response = self._anthropic.completions.create(
            model="claude-v1-100k",
            prompt=prompt,
        )
        return response.completion

    def count_tokens(self, text: str) -> int:
        return self._anthropic.count_tokens(text)
