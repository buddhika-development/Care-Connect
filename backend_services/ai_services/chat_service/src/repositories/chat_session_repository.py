import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from src.models.chat_session import ChatSession

logger = logging.getLogger(__name__)

_PLACEHOLDER_TITLE = "New Chat"


class ChatSessionRepository:
    """Data-access layer for the chat_session table."""

    def __init__(self, db: AsyncSession):
        self._db = db

    async def get_by_id(self, session_id: uuid.UUID) -> ChatSession | None:
        """Return a ChatSession by primary key, or None if not found."""
        result = await self._db.execute(
            select(ChatSession).where(ChatSession.id == session_id)
        )
        return result.scalar_one_or_none()

    async def create_session(
        self,
        user_id: uuid.UUID,
        title: str = _PLACEHOLDER_TITLE,
    ) -> ChatSession:
        """Insert a new ChatSession row and return it with the generated ID."""
        session = ChatSession(
            user_id=user_id,
            chat_title=title,
        )
        self._db.add(session)
        await self._db.flush()
        await self._db.refresh(session)
        logger.info("Created new ChatSession id=%s for user=%s", session.id, user_id)
        return session

    async def update_session_title(
        self,
        session_id: uuid.UUID,
        title: str,
    ) -> None:
        """Update the chat_title of an existing session."""
        await self._db.execute(
            update(ChatSession)
            .where(ChatSession.id == session_id)
            .values(chat_title=title)
        )
        await self._db.commit()
        logger.info("Updated title for ChatSession id=%s → '%s'", session_id, title)
