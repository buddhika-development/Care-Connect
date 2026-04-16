import logging

from fastapi import APIRouter, HTTPException, status

from src.schemas.document_schema import DoctorSemanticRequest, DoctorSemanticResponse
from src.services.doctor_embedding_service import DoctorEmbeddingService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/doctor", tags=["Doctor"])


@router.patch(
    "/semantic",
    summary="Generate and store a semantic embedding for a doctor",
    description=(
        "Accepts a doctor_id and doctor_bio, converts the bio into a vector embedding "
        "using Google Generative AI Embeddings, then PATCHes the Doctor Service "
        "at /api/doctors/profile/:doctorId/embedding with the resulting vector."
    ),
    response_model=DoctorSemanticResponse,
    status_code=status.HTTP_200_OK,
)
async def update_doctor_semantic(
    request: DoctorSemanticRequest,
) -> DoctorSemanticResponse:
    logger.info(
        "Doctor semantic embedding request received: doctor_id=%s",
        request.doctor_id,
    )
    try:
        return await DoctorEmbeddingService.generate_and_store_embedding(request)
    except Exception as exc:
        logger.error("Doctor embedding update failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate/store doctor embedding: {str(exc)}",
        )
