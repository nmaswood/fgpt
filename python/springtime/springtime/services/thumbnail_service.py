import abc
import os
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image


class ThumbnailService(abc.ABC):
    @abc.abstractmethod
    def for_pdf(self, *, file_path: str, output_dir: str) -> str:
        pass


class FitzThumbnailService(ThumbnailService):
    ZOOM_LEVEL = 2.0

    def for_pdf(self, *, file_path: str, output_dir: str) -> str:
        pdf_file = fitz.open(file_path)
        page = pdf_file[0]

        file_name = Path(file_path).stem

        # Set the zoom level

        # Generate the matrix
        mat = fitz.Matrix(self.ZOOM_LEVEL, self.ZOOM_LEVEL)

        # Render the page to an image
        pix = page.get_pixmap(matrix=mat)

        # Convert the image to a PIL image
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

        output_file_name = os.path.join(output_dir, f"{file_name}.webp")
        img.save(output_file_name, "webp", optimize=True, quality=10)
        return output_file_name
