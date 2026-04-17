import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.user_summary import UserSummary

logger = logging.getLogger(__name__)


class UserSummaryRepository:
    """Data-access layer for the user_summary table."""

    def __init__(self, db: AsyncSession):
        self._db = db

    async def get_by_user_id(self, user_id: uuid.UUID) -> UserSummary | None:
        result = await self._db.execute(
            select(UserSummary).where(UserSummary.user_id == user_id).limit(1)
        )
        return result.scalar_one_or_none()

    async def upsert(self, user_id: uuid.UUID, user_summary: str) -> UserSummary:
        record = await self.get_by_user_id(user_id)

        if record:
            record.user_summary = user_summary
            await self._db.flush()
            await self._db.refresh(record)
            logger.info("Updated user summary for user_id=%s", user_id)
            return record

        record = UserSummary(
            user_id=user_id,
            user_summary=user_summary,
        )
        self._db.add(record)
        await self._db.flush()
        await self._db.refresh(record)
        logger.info("Created user summary for user_id=%s", user_id)
        return record
