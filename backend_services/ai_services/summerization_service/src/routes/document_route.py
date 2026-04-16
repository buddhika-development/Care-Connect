import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db.deps import get_db
from src.repositories.document_summary_repository import DocumentSummaryRepository
from src.schemas.document_schema import (
    DocumentAnalyzeRequest,
    DocumentAnalyzeResponse,
    DocumentSummaryRecord,
)
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


@router.get(
    "/{document_id}/summary",
    summary="Get summary for a specific document",
    description="Returns the most recent AI-generated summary stored for the given document_id.",
    response_model=DocumentSummaryRecord,
    status_code=status.HTTP_200_OK,
)
async def get_document_summary(
    document_id: str,
    db: AsyncSession = Depends(get_db),
) -> DocumentSummaryRecord:
    logger.info("Fetching summary for document_id=%s", document_id)
    repo = DocumentSummaryRepository(db)
    record = await repo.get_by_document_id(document_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No summary found for document_id '{document_id}'",
        )
    return record


@router.get(
    "/user/{user_id}/summaries",
    summary="Get all document summaries for a user",
    description="Returns all document summaries stored for the given user, ordered newest first.",
    response_model=list[DocumentSummaryRecord],
    status_code=status.HTTP_200_OK,
)
async def get_user_document_summaries(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> list[DocumentSummaryRecord]:
    logger.info("Fetching all document summaries for user_id=%s", user_id)
    repo = DocumentSummaryRepository(db)
    return await repo.get_by_user_id(user_id)
