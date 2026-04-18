import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db.deps import get_db
from src.schemas.document_schema import (
    UserAnalyzeRequest,
    UserAnalyzeResponse,
    UserDetailsResponse,
)
from src.services.summarization_service import SummarizationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/user", tags=["User"])


@router.post(
    "/analyze",
    summary="Update a patient's health summary",
    description=(
        "Accepts the patient's existing health summary and new health information, "
        "then returns a single AI-generated merged summary produced by Mistral."
    ),
    response_model=UserAnalyzeResponse,
    status_code=status.HTTP_200_OK,
)
async def analyze_user(
    request: UserAnalyzeRequest,
    db: AsyncSession = Depends(get_db),
) -> UserAnalyzeResponse:
    logger.info(
        "User analyze request received: user_id=%s",
        request.user_id,
    )

    try:
        return await SummarizationService.analyze_user(request, db)
    except Exception as exc:
        logger.error("User summary update failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user summary: {str(exc)}",
        )


@router.get(
    "/{user_id}/details",
    summary="Get stored user summary details",
    description=(
        "Returns persisted user summary details for the given user_id. "
        "If no summary exists for the user, returns 404."
    ),
    response_model=UserDetailsResponse,
    status_code=status.HTTP_200_OK,
)
async def get_user_details(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> UserDetailsResponse:
    logger.info("Fetch user details request received: user_id=%s", user_id)

    record = await SummarizationService.get_user_details(user_id, db)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No user details found for user_id '{user_id}'",
        )

    return record
