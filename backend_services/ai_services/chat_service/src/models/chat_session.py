import uuid
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from src.core.db.postgres_connection import Base
from src.models.base import UUIDTimestampMixin

class ChatSession(UUIDTimestampMixin, Base):
    __tablename__ = "chat_session"

    chat_title: Mapped[str] = mapped_column(String(255), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
