from pydantic import BaseModel, NonNegativeInt
import tiktoken


class TokenLengthResponse(BaseModel):
    gpt4: NonNegativeInt


enc_gpt4 = tiktoken.encoding_for_model("gpt-4")


def get_token_length(text: str):
    for_4 = enc_gpt4.encode(text)
    return TokenLengthResponse(gpt4=len(for_4))
