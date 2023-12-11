import pytest
from anthropic import Anthropic

from springtime.services.prompt_service import (
    PromptRequest,
    PromptService,
    PromptServiceImpl,
)


@pytest.fixture()
def prompt_service() -> PromptService:
    return PromptServiceImpl(Anthropic())


TEMPLATE = """
I am going to give you a number X. Please answer with the number that comes after X.

Examples:

Input: four
Output: five

Input: six
Output: seven

Input: one
Output: two

Input: {paredo_test}

Reply with nothing else except the name of the number in lowercase
"""


def test_scan(prompt_service: PromptService):
    output = prompt_service.run(
        req=PromptRequest(
            template=TEMPLATE,
            args={"paredo_test": "nine"},
        ),
    )

    assert output.raw == "ten"
    assert output.input_tokens == 80
    assert output.output_tokens == 1
