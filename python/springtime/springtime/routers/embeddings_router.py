from fastapi import APIRouter
from pydantic import BaseModel

from springtime.services.embeddings_service import EmbeddingsService


class EmbeddingForDocumentRequest(BaseModel):
    documents: list[str]


class EmbeddingForDocumentResponse(BaseModel):
    response: list[list[float]]


class EmbeddingsRouter:
    def __init__(self, embeddings_service: EmbeddingsService) -> None:
        self.embeddings_service = embeddings_service

    def get_router(self):
        router = APIRouter(prefix="/embeddings")

        @router.post("/embedding-for-documents")
        def embeddings_for_documents_route(req: EmbeddingForDocumentRequest):
            response = self.embeddings_service.embed_documents(req.documents)
            return EmbeddingForDocumentResponse(response=response)

        return router
