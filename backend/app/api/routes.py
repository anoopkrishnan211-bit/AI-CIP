import logging

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.core.config import get_settings
from app.features.report.ai_service import AIReportService
from app.features.report.evaluator import build_demo_report
from app.features.resume.analyzer import analyze_resume
from app.features.resume.parser import UnsupportedDocumentError, extract_text
from app.schemas.career import CareerReport, ReportRequest, ResumeAnalysis

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1")


@router.get("/health")
def health() -> dict[str, str]:
    settings = get_settings()
    return {
        "status": "ok",
        "mode": "ai" if settings.ai_enabled else "demo",
        "version": settings.app_version,
    }


@router.post("/resumes/analyze", response_model=ResumeAnalysis)
async def analyze_resume_upload(file: UploadFile = File(...)) -> ResumeAnalysis:
    settings = get_settings()
    content = await file.read(settings.max_upload_mb * 1024 * 1024 + 1)
    await file.close()
    if len(content) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Resume must be smaller than {settings.max_upload_mb} MB.",
        )
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded resume is empty.")

    try:
        text = extract_text(file.filename or "resume", content)
    except UnsupportedDocumentError as exc:
        raise HTTPException(status_code=415, detail=str(exc)) from exc

    if len(text.strip()) < 40:
        raise HTTPException(
            status_code=422,
            detail="We could not find enough readable text in this resume.",
        )
    return analyze_resume(file.filename or "resume", text[:50_000])


@router.post("/reports/generate", response_model=CareerReport)
def generate_report(request: ReportRequest) -> CareerReport:
    settings = get_settings()
    if not settings.ai_enabled:
        return build_demo_report(request)

    try:
        service = AIReportService(
            api_key=settings.openai_api_key or "",
            model=settings.openai_model,
        )
        return service.generate(request)
    except Exception:
        logger.exception("AI report generation failed; using deterministic fallback.")
        return build_demo_report(request)

