import abc
import openai


MODEL = "text-embedding-ada-002"


class EmbeddingsService(abc.ABC):
    @abc.abstractmethod
    def embed_documents(self, documents: list[str]) -> list[list[float]]:
        pass


class OpenAIEmbeddingsService(EmbeddingsService):
    def embed_documents(self, documents: list[str]) -> list[list[float]]:
        response = openai.Embedding.create(input=documents, model=MODEL)
        return [data.embedding for data in response["data"]]
