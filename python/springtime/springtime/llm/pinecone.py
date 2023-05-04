from re import S
import random
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
        include_values=True,
        filter=metadata,
        namespace=SETTINGS.pinecone_namespace
    )
    matches = result['matches']

    return [match['id'] for match in matches]


def get_pinecone_index():
    global INDEX
    if INDEX is None:
        INDEX = pinecone.Index(index_name=SETTINGS.pinecone_index)
    return INDEX


def generate_fake_vector(size: int):
    return [random.random() for _ in range(size)]


def play_pinecone():
    # index = get_pinecone_index()

    # upsert_response = index.upsert(
    # vectors=[
    # ("vec1", generate_fake_vector(1536), {"genre": "drama"}),
    # ("vec2", generate_fake_vector(1536), {"genre": "action"}),
    # ],
    # namespace=SETTINGS.pinecone_namespace
    # )

    fake = generate_fake_vector(1536)
    get_similar(fake, {})
    # print(upsert_response)
