from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel
from springtime.services.vector_service import VectorService, UpsertVector


class UpsertVectorRequest(BaseModel):
    vectors: list[UpsertVector]


class SimilarVectorRequest(BaseModel):
    vector: list[float]
    metadata: dict[str, Any]


class VectorRouter:
    def __init__(self, vector_service: VectorService):
        self.vector_service = vector_service

    def get_router(self):
        router = APIRouter(prefix="/vector")

        @router.put("/upsert-vectors")
        async def upsert_vectors_route(req: UpsertVectorRequest):
            if req.vectors:
                self.vector_service.upsert(req.vectors)
            return {"upsert_count": len(req.vectors)}

        @router.post("/similar-vectors")
        async def similar_vectors_route(req: SimilarVectorRequest):
            results = self.vector_service.get_similar(req.vector, req.metadata)
            return {"results": results}

        return router
