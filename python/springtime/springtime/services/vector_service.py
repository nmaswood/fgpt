import abc

import pinecone
from pydantic import BaseModel

from ..settings import SETTINGS


class UpsertVector(BaseModel):
    id: str
    vector: list[float]
    metadata: dict[str, str] = {}


class VectorResult(BaseModel):
    id: str
    metadata: dict[str, str] = {}
    score: float


class VectorService(abc.ABC):
    @abc.abstractmethod
    def upsert(self, vectors: list[UpsertVector]) -> None:
        pass

    @abc.abstractmethod
    def get_similar(
        self,
        vector: list[float],
        metadata: dict[str, str],
    ) -> list[VectorResult]:
        pass


class PineconeVectorService(VectorService):
    def __init__(
        self,
        *,
        api_key: str,
        environment: str,
        index_name: str,
        namespace: str,
    ) -> None:
        pinecone.init(api_key=api_key, environment=environment)
        self.index = pinecone.Index(index_name=index_name)
        self.namespace = namespace

    def upsert(self, upsert_vectors: list[UpsertVector]):
        self.index.upsert(
            vectors=[
                (upsert_vector.id, upsert_vector.vector, upsert_vector.metadata)
                for upsert_vector in upsert_vectors
            ],
            namespace=SETTINGS.pinecone_namespace,
        )

    def get_similar(
        self,
        vector: list[float],
        metadata: dict[str, str],
    ) -> list[VectorResult]:
        result = self.index.query(
            vector=vector,
            top_k=10,
            include_values=False,
            include_metadata=True,
            filter=metadata,
            namespace=self.namespace,
        )

        matches = result["matches"]
        return [
            VectorResult(
                id=match["id"],
                metadata=match["metadata"],
                score=match["score"],
            )
            for match in matches
        ]
