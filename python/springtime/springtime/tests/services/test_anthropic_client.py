import pytest
import os

from springtime.services.anthropic_client import AnthropicClient


XLSX = os.path.join(os.path.dirname(__file__), "../data/dummy-extracted.xlsx")


@pytest.fixture
def anthropic_client():
    return AnthropicClient()


def test_complete(anthropic_client: AnthropicClient):
    resp = anthropic_client.complete("Respond with the letter A exactly once")
    assert resp.strip() == "A"


def test_count(anthropic_client: AnthropicClient):
    resp = anthropic_client.count_tokens("Please respond with the letter A exactly one")
    assert resp > 0
