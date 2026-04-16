import logging

from langchain_google_genai import GoogleGenerativeAIEmbeddings

from src.config import config
from src.core.http.doctor_client import doctor_client
from src.schemas.document_schema import DoctorSemanticRequest, DoctorSemanticResponse

logger = logging.getLogger(__name__)

_embeddings = GoogleGenerativeAIEmbeddings(
    google_api_key=config.gemini_api_key,
    model=config.google_embedding_model,
)


class DoctorEmbeddingService:
    """Generates a vector embedding for a doctor bio and persists it via the Doctor Service."""

    @staticmethod
    async def generate_and_store_embedding(
        request: DoctorSemanticRequest,
    ) -> DoctorSemanticResponse:
        """
        Pipeline for PATCH /api/v1/doctor/semantic:

          1. Embed `doctor_bio` using Google Generative AI Embeddings.
          2. PATCH the Doctor Service with the resulting vector.
          3. Return the Doctor Service response wrapped in DoctorSemanticResponse.
        """
        logger.info(
            "Generating embedding for doctor_id=%s (bio length=%d)",
            request.doctor_id,
            len(request.doctor_bio),
        )

        try:
            embedding: list[float] = await _embeddings.aembed_query(request.doctor_bio)
        except Exception as exc:
            logger.error(
                "Embedding generation failed for doctor_id=%s: %s",
                request.doctor_id,
                exc,
            )
            raise

        logger.info(
            "Embedding generated for doctor_id=%s — %d dimensions",
            request.doctor_id,
            len(embedding),
        )

        doctor_response = await doctor_client.update_doctor_embedding(
            doctor_id=request.doctor_id,
            embedding=embedding,
        )

        return DoctorSemanticResponse(
            success=doctor_response.get("success", True),
            message=doctor_response.get("message", "Doctor embedding updated successfully"),
            data=doctor_response.get("data", {}),
        )
