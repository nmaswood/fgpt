import abc

from google.cloud import storage


class ObjectStore(abc.ABC):
    @abc.abstractmethod
    def upload_from_filename(self, bucket_name: str, path: str, filename: str) -> None:
        pass

    @abc.abstractmethod
    def download_to_filename(self, bucket_name: str, path: str, filename: str) -> None:
        pass


class GCSObjectStore(ObjectStore):
    def __init__(self) -> None:
        self.client: storage.Client = storage.Client()

    def upload_from_filename(
        self,
        bucket_name: str,
        path: str,
        filename: str,
        content_type: str | None = None,
    ) -> None:
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(path)
        blob.upload_from_filename(
            filename,
            content_type=content_type,
        )

    def download_to_filename(self, bucket_name: str, path: str, filename: str) -> None:
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(path)
        blob.download_to_filename(filename)
