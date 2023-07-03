from springtime.services.report_service import (
    FinancialSummary,
    Term,
    ReportService,
)
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel


class LLMOutputRequest(BaseModel):
    text: str


class LLMOutputResponse(BaseModel):
    summaries: list[str] = []
    questions: list[str] = []
    terms: list[Term] = []
    financial_summary: FinancialSummary


class PlaygroundResponse(BaseModel):
    raw: dict[str, Any]


class ReportRouter:
    def __init__(self, report_service: ReportService):
        self.report_service = report_service

    def get_router(self):
        router = APIRouter(prefix="/report")

        @router.post("/llm-output")
        async def llm_output_route(req: LLMOutputRequest):
            res = self.report_service.generate_output(req.text)
            return res

        return router
