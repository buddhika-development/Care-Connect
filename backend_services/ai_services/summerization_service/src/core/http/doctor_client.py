import logging
from typing import Any

import httpx

from src.config import config

logger = logging.getLogger(__name__)


class DoctorClient:
    """HTTP client for the Doctor Service at DOCTOR_SERVICE_URL."""

    def __init__(self):
        self._base_url = config.doctor_service_url.rstrip("/")

    async def update_doctor_embedding(
        self,
        doctor_id: str,
        embedding: list[float],
    ) -> dict[str, Any]:
        """
        PATCH /api/doctors/profile/:doctorId/embedding

        Sends the computed embedding vector to the Doctor Service and returns
        the full response payload.
        """
        url = f"{self._base_url}/api/doctors/profile/{doctor_id}/embedding"
        payload = {"embedding": embedding}
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.patch(url, json=payload)
                response.raise_for_status()
                logger.info(
                    "Doctor embedding updated for doctor_id=%s (%d dimensions)",
                    doctor_id,
                    len(embedding),
                )
                return response.json()
        except httpx.HTTPStatusError as exc:
            logger.error(
                "Doctor service PATCH returned %s for doctor_id=%s: %s",
                exc.response.status_code,
                doctor_id,
                exc,
            )
            raise
        except Exception as exc:
            logger.error(
                "Failed to update doctor embedding for doctor_id=%s: %s",
                doctor_id,
                exc,
            )
            raise


doctor_client = DoctorClient()
