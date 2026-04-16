import logging

from fastapi import APIRouter, HTTPException, status

from src.schemas.document_schema import DocumentAnalyzeRequest, DocumentAnalyzeResponse
from src.services.summarization_service import SummarizationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/document", tags=["Document"])


@router.patch(
    "/analyze",
    summary="Analyze and summarize a document",
    description=(
        "Accepts a document URL, fetches and parses it using Docling, "
        "then returns an AI-generated structured summary produced by Gemini."
    ),
    response_model=DocumentAnalyzeResponse,
    status_code=status.HTTP_200_OK,
)
async def analyze_document(
    request: DocumentAnalyzeRequest,
) -> DocumentAnalyzeResponse:
    logger.info(
        "Document analyze request received: document_id=%s url=%s",
        request.document_id,
        request.document_url,
    )

    try:
        return await SummarizationService.analyze_document(request)
    except Exception as exc:
        logger.error("Document analysis failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze document: {str(exc)}",
        )
