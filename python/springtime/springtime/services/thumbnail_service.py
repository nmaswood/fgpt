import abc


class ThumbnailService(abc.ABC):
    @abc.abstractmethod
    def for_pdf(self, *, file_path: str, output_dir: str) -> str:
        pass


class FitzThumbnailService(ThumbnailService):
    def for_pdf(self, *, file_path: str, output_dir: str) -> None:
        pass
