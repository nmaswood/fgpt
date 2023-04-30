import pinecone

from ..settings import SETTINGS

pinecone.init(api_key=SETTINGS.pinecone_api_key)


def play_pinecone():
    pass
