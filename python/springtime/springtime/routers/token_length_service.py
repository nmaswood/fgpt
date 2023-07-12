import anthropic
import tiktoken


ENC_GPT4 = tiktoken.encoding_for_model("gpt-4")


client = anthropic.Anthropic()


class TokenLength:
    @staticmethod
    def gpt4(text: str):
        return len(ENC_GPT4.encode(text))

    @staticmethod
    def claude100k(text: str):
        return client.count_tokens(text)
