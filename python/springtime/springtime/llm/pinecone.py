from os import name
from re import S
import random
from sre_compile import IN
import pinecone

from pydantic import BaseModel

from ..settings import SETTINGS

pinecone.init(api_key=SETTINGS.pinecone_api_key,
              environment=SETTINGS.pinecone_env)


INDEX: pinecone.Index | None = None


class UpsertVector(BaseModel):
    id: str
    vector: list[float]
    metadata: dict[str, str] = {}


def upsert_vectors(upsert_vectors: list[UpsertVector]):
    index = get_pinecone_index()
    ids = sorted(upsert_vector.id for upsert_vector in upsert_vectors)
    print("Upserting vectors with ids", ids)

    index.upsert(
        vectors=[
            (upsert_vector.id, upsert_vector.vector, upsert_vector.metadata) for upsert_vector in upsert_vectors
        ],
        namespace=SETTINGS.pinecone_namespace
    )


def get_similar(vector: list[float], metadata: dict[str, str]) -> list[str]:
    index = get_pinecone_index()

    result = index.query(
        vector=vector,
        top_k=15,
        include_values=False,
        include_metadata=True,
        filter=metadata,
        namespace=SETTINGS.pinecone_namespace
    )
    print("Metadata query is", metadata)
    print ("Result is", result)
    matches = result['matches']

    return [match['id'] for match in matches]


def get_pinecone_index():
    global INDEX
    if INDEX is None:
        INDEX = pinecone.Index(index_name=SETTINGS.pinecone_index)
    resp = INDEX.delete(delete_all=True, namespace='production')
    return INDEX

