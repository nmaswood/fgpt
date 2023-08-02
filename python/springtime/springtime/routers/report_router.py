from fastapi import APIRouter
from pydantic import BaseModel

from springtime.services.long_form_report_service import LongformReportService
from springtime.services.report_service import (
    ReportService,
    Term,
)
from springtime.services.scan_service import ScanService


class LLMOutputRequest(BaseModel):
    text: str


class GenerateQuestionsResponse(BaseModel):
    questions: list[str]


class GenerateTermsResponse(BaseModel):
    terms: list[Term]


class ScanRequest(BaseModel):
    file_name: str
    text: str


class LongFormReportRequest(BaseModel):
    text: str


class LongFormReportResponse(BaseModel):
    raw: str
    sanitized_html: str | None


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

        @router.post("/generate-questions")
        def questions_route(req: LLMOutputRequest) -> GenerateQuestionsResponse:
            questions = self.report_service.generate_questions(req.text)
            return GenerateQuestionsResponse(questions=questions)

        @router.post("/generate-terms")
        def terms_route(req: LLMOutputRequest) -> GenerateTermsResponse:
            terms = self.report_service.generate_terms(req.text)
            return GenerateTermsResponse(terms=terms)

        @router.post("/scan")
        def scan_route(req: ScanRequest):
            return self.scan_service.scan(file_name=req.file_name, text=req.text)

        @router.post("/long-form")
        def long_form_route(req: LongFormReportRequest):
            resp = self.long_form_report_service.generate(req.text)
            return LongFormReportResponse(
                raw=resp.raw,
                sanitized_html=resp.sanitized_html,
            )

        return router
