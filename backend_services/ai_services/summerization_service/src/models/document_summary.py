import uuid
from sqlalchemy import Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db.postgres_connection import Base
from src.models.base import UUIDTimestampMixin


class DocumentSummary(UUIDTimestampMixin, Base):
    __tablename__ = "document_summary"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    document_id: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        index=True,
    )
    document_summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
