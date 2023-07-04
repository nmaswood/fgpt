import os
import pytest


@pytest.fixture(scope="session")
def bucket_name():
    return os.environ.get("BUCKET_NAME", "fgpt-asset-store-local")
