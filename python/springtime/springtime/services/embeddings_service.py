import abc

from langchain.embeddings import OpenAIEmbeddings


class EmbeddingsService(abc.ABC):
    @abc.abstractmethod
    def embed_documents(self, documents: list[str]) -> list[list[float]]:
        pass

    @abc.abstractmethod
    def embed_query(self, query: str) -> list[float]:
        pass


class OpenAIEmbeddingsService(EmbeddingsService):
    def __init__(self):
        self.embeddings = OpenAIEmbeddings()

    def embed_documents(self, documents: list[str]) -> list[list[float]]:
        return self.embeddings.embed_documents(documents)

    def embed_query(self, query: str) -> list[float]:
        return self.embeddings.embed_query(query)
