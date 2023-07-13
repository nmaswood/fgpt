from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from springtime.services.long_form_report_service import LongformReportService
from springtime.services.report_service import (
    FinancialSummary,
    ReportService,
    Term,
)


class LLMOutputRequest(BaseModel):
    text: str


class LongFormReportRequest(BaseModel):
    text: str


class LongFormReportResponse(BaseModel):
    content: str


class LLMOutputResponse(BaseModel):
    summaries: list[str] = []
    questions: list[str] = []
    terms: list[Term] = []
    financial_summary: FinancialSummary


class PlaygroundResponse(BaseModel):
    raw: dict[str, Any]


class ReportRouter:
    def __init__(
        self,
        report_service: ReportService,
        long_form_report_service: LongformReportService,
    ) -> None:
        self.report_service = report_service
        self.long_form_report_service = long_form_report_service

    def get_router(self):
        router = APIRouter(prefix="/report")

        @router.post("/llm-output")
        async def llm_output_route(req: LLMOutputRequest):
            res = self.report_service.generate_output(req.text)
            return res

        @router.post("/long-form")
        async def long_form_route(req: LongFormReportRequest):
            content = self.long_form_report_service.generate(req.text)
            return LongFormReportResponse(content=content)

        return router
