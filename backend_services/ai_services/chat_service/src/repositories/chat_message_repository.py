import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.chat_message import ChatMessage

logger = logging.getLogger(__name__)


class ChatMessageRepository:
    """Data-access layer for the chat_message table."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_session_id(self, session_id: uuid.UUID) -> list[ChatMessage]:
        """Return all messages for a session, ordered by turn index ascending."""
        result = await self._db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.message_index.asc())
        )
        return list(result.scalars().all())

    async def create_message(
        self,
        session_id: uuid.UUID,
        role: str,
        content: str,
        message_index: int,
    ) -> ChatMessage:
        """Insert a single conversation turn and return it with generated ID."""
        message = ChatMessage(
            session_id=session_id,
            role=role,
            content=content,
            message_index=message_index,
        )
        self._db.add(message)
        await self._db.flush()
        await self._db.refresh(message)
        logger.debug(
            "Created ChatMessage session=%s role=%s index=%d",
            session_id,
            role,
            message_index,
        )
        return message
