import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db.deps import get_db
from src.schemas.document_schema import DocumentAnalyzeRequest, DocumentAnalyzeResponse
from src.services.summarization_service import SummarizationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/document", tags=["Document"])


@router.patch(
    "/analyze",
    summary="Analyze and summarize a document",
    description=(
        "Accepts a document URL, fetches and parses it using Docling, "
        "generates an AI summary with Gemini, stores it in the database, "
        "then merges it with the patient's existing summary and updates the Patient Service."
    ),
    response_model=DocumentAnalyzeResponse,
    status_code=status.HTTP_200_OK,
)
async def analyze_document(
    request: DocumentAnalyzeRequest,
    db: AsyncSession = Depends(get_db),
) -> DocumentAnalyzeResponse:
    logger.info(
        "Document analyze request received: user_id=%s document_id=%s url=%s",
        request.user_id,
        request.document_id,
        request.document_url,
    )

    try:
        return await SummarizationService.analyze_document(request, db)
    except Exception as exc:
        logger.error("Document analysis failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze document: {str(exc)}",
        )
