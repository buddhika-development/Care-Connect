import logging

from fastapi import APIRouter, HTTPException, status

from src.schemas.document_schema import UserAnalyzeRequest, UserAnalyzeResponse
from src.services.summarization_service import SummarizationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/user", tags=["User"])


@router.post(
    "/analyze",
    summary="Update a patient's health summary",
    description=(
        "Accepts the patient's existing health summary and new health information, "
        "then returns a single AI-generated merged summary produced by Gemini."
    ),
    response_model=UserAnalyzeResponse,
    status_code=status.HTTP_200_OK,
)
async def analyze_user(
    request: UserAnalyzeRequest,
) -> UserAnalyzeResponse:
    logger.info(
        "User analyze request received: user_id=%s",
        request.user_id,
    )

    try:
        return await SummarizationService.analyze_user(request)
    except Exception as exc:
        logger.error("User summary update failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user summary: {str(exc)}",
        )
