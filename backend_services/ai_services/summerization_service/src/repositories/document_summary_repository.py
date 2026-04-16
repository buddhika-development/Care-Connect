import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.document_summary import DocumentSummary

logger = logging.getLogger(__name__)


class DocumentSummaryRepository:
    """Data-access layer for the document_summary table."""

    def __init__(self, db: AsyncSession):
        self._db = db

    async def create(
        self,
        user_id: uuid.UUID,
        document_id: str,
        document_summary: str,
    ) -> DocumentSummary:
        """Insert a new DocumentSummary row and return it."""
        record = DocumentSummary(
            user_id=user_id,
            document_id=document_id,
            document_summary=document_summary,
        )
        self._db.add(record)
        await self._db.flush()
        await self._db.refresh(record)
        logger.info(
            "Stored document summary id=%s for user=%s document=%s",
            record.id,
            user_id,
            document_id,
        )
        return record

    async def get_by_document_id(self, document_id: str) -> DocumentSummary | None:
        """Return the most recent DocumentSummary for a given document_id, or None."""
        result = await self._db.execute(
            select(DocumentSummary)
            .where(DocumentSummary.document_id == document_id)
            .order_by(DocumentSummary.created_datetime.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_by_user_id(self, user_id: uuid.UUID) -> list[DocumentSummary]:
        """Return all DocumentSummary rows for a user, newest first."""
        result = await self._db.execute(
            select(DocumentSummary)
            .where(DocumentSummary.user_id == user_id)
            .order_by(DocumentSummary.created_datetime.desc())
        )
        return list(result.scalars().all())
