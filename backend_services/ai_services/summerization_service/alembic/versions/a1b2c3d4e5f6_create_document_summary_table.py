"""create document_summary table

Revision ID: a1b2c3d4e5f6
Revises:
Create Date: 2026-04-16 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the document_summary table."""
    op.create_table(
        "document_summary",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "document_id",
            sa.Text(),
            nullable=False,
        ),
        sa.Column(
            "document_summary",
            sa.Text(),
            nullable=False,
        ),
        sa.Column(
            "created_datetime",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_datetime",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_document_summary_user_id", "document_summary", ["user_id"])
    op.create_index("ix_document_summary_document_id", "document_summary", ["document_id"])


def downgrade() -> None:
    """Drop the document_summary table."""
    op.drop_index("ix_document_summary_document_id", table_name="document_summary")
    op.drop_index("ix_document_summary_user_id", table_name="document_summary")
    op.drop_table("document_summary")
