from anthropic import Anthropic


MAX_TOKENS_TO_SAMPLE = 1_000_000


class AnthropicClient:
    def __init__(self):
        self._anthropic = Anthropic()

    def complete(self, prompt: str) -> str:
        response = self._anthropic.completions.create(
            model="claude-2",
            prompt=prompt,
            max_tokens_to_sample=MAX_TOKENS_TO_SAMPLE,
        )
        return response.completion

    def count_tokens(self, text: str) -> int:
        return self._anthropic.count_tokens(text)
