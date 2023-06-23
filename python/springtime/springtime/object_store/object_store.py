import abc
from google.cloud import storage


class ObjectStore(abc.ABC):

    @abc.abstractmethod
    def upload_from_file(self, bucket_name: str, path: str, filename: str) -> None:
        pass

    @abc.abstractmethod
    def download_to_file(self, bucket_name: str, path: str, filename: str) -> None:
        pass


class GCSObjectStore(ObjectStore):
    def __init__(self):
        self.client: storage.Client = storage.Client()

    def upload_from_file(self, bucket_name: str, path: str, filename: str) -> None:
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(path)
        blob.upload_from_filename(filename)

    def download_to_file(self, bucket_name: str, path: str, filename: str) -> None:
        pass

        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(path)
        blob.download_to_file(filename)
