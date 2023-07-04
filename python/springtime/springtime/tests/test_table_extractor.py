import pytest
import os
from unittest.mock import MagicMock

from springtime.excel.table_extractor import (
    ExtractionArguments,
    TableExtractor,
    TabulaTableExtractor,
)


@pytest.fixture
def table_extractor():
    object_store = MagicMock()
    return TabulaTableExtractor(object_store)


PDF = os.path.join(os.path.dirname(__file__), "American-casinos-CIM.pdf")


def test_extract(table_extractor: TableExtractor):
    args = ExtractionArguments(
        file_name=PDF,
        title="American-casinos-CIM",
        bucket="bucket",
        output_prefix="output_prefix",
    )

    res = table_extractor.extract(args)
    assert res.number_of_sheets == 20
    assert res.xl
    assert res.path
