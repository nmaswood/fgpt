from fastapi import APIRouter
from pydantic import BaseModel

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
    html: str | None


class ReportRouter:
    def __init__(
        self,
        gpt_report_service: ReportService,
        scan_service: ScanService,
    ) -> None:
        self.gpt_report_service = gpt_report_service
        self.scan_service = scan_service

    def get_router(self):
        router = APIRouter(prefix="/report")

        # GPT
        @router.post("/generate-questions")
        def questions_route(req: LLMOutputRequest) -> GenerateQuestionsResponse:
            questions = self.gpt_report_service.generate_questions_for_text(req.text)
            return GenerateQuestionsResponse(questions=questions)

        @router.post("/generate-terms")
        def terms_route(req: LLMOutputRequest) -> GenerateTermsResponse:
            terms = self.gpt_report_service.generate_terms(req.text)
            return GenerateTermsResponse(terms=terms)

        @router.post("/scan")
        def scan_route(req: ScanRequest):
            return self.scan_service.scan(file_name=req.file_name, text=req.text)

        return router
