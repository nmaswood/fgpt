from fastapi import APIRouter
from pydantic import BaseModel

from springtime.services.long_form_report_service import LongformReportService
from springtime.services.report_service import (
    FinancialSummary,
    ReportService,
    Term,
)
from springtime.services.scan_service import ScanService


class LLMOutputRequest(BaseModel):
    text: str


class ScanRequest(BaseModel):
    file_name: str
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


class ReportRouter:
    def __init__(
        self,
        report_service: ReportService,
        long_form_report_service: LongformReportService,
        scan_service: ScanService,
    ) -> None:
        self.report_service = report_service
        self.long_form_report_service = long_form_report_service
        self.scan_service = scan_service

    def get_router(self):
        router = APIRouter(prefix="/report")

        @router.post("/llm-output")
        async def llm_output_route(req: LLMOutputRequest):
            return self.report_service.generate_output(req.text)

        @router.post("/scan")
        async def scan_route(req: ScanRequest):
            return self.scan_service.scan(file_name=req.file_name, text=req.text)

        @router.post("/long-form")
        async def long_form_route(req: LongFormReportRequest):
            content = self.long_form_report_service.generate(req.text)
            return LongFormReportResponse(content=content)

        return router
