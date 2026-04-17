import uuid

from sqlalchemy import Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db.postgres_connection import Base
from src.models.base import UUIDTimestampMixin


class UserSummary(UUIDTimestampMixin, Base):
    __tablename__ = "user_summary"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        unique=True,
        index=True,
    )
    user_summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
