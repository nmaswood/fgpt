import os
import tempfile

import pytest

from springtime.services.thumbnail_service import FitzThumbnailService, ThumbnailService


@pytest.fixture()
def thumbnail_service():
    return FitzThumbnailService()


DIR = os.path.dirname(__file__)
PDF = os.path.join(DIR, "../data", "American-casinos-CIM.pdf")


def test_get_thumbnail(thumbnail_service: ThumbnailService):
    with tempfile.TemporaryDirectory() as tmp_dir:
        res = thumbnail_service.for_pdf(
            file_path=PDF,
            output_dir=tmp_dir,
        )
