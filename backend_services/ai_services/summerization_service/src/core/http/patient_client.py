import logging

import httpx

from src.config import config

logger = logging.getLogger(__name__)


class PatientClient:
    """HTTP client for the Patient Service at PATIENT_SERVICE_URL."""

    def __init__(self):
        self._base_url = config.patient_service_url.rstrip("/")

    async def get_patient_summary(self, user_id: str) -> str | None:
        """
        GET /api/patients/profile/:userId

        Returns the current value of `patient_summary`, or None if the field
        is empty / the profile does not exist.
        """
        url = f"{self._base_url}/api/patients/profile/{user_id}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                return data.get("patient_summary") or None
        except httpx.HTTPStatusError as exc:
            logger.error(
                "Patient service returned %s for user_id=%s: %s",
                exc.response.status_code,
                user_id,
                exc,
            )
            raise
        except Exception as exc:
            logger.error(
                "Failed to fetch patient profile for user_id=%s: %s", user_id, exc
            )
            raise

    async def update_patient_summary(self, user_id: str, patient_summary: str) -> None:
        """
        PATCH /api/patients/profile/:userId

        Sends the updated patient_summary back to the Patient Service.
        """
        url = f"{self._base_url}/api/patients/profile/{user_id}"
        payload = {"patient_summary": patient_summary}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.patch(url, json=payload)
                response.raise_for_status()
                logger.info(
                    "Patient summary updated for user_id=%s (%d chars)",
                    user_id,
                    len(patient_summary),
                )
        except httpx.HTTPStatusError as exc:
            logger.error(
                "Patient service PATCH returned %s for user_id=%s: %s",
                exc.response.status_code,
                user_id,
                exc,
            )
            raise
        except Exception as exc:
            logger.error(
                "Failed to update patient summary for user_id=%s: %s", user_id, exc
            )
            raise


patient_client = PatientClient()
