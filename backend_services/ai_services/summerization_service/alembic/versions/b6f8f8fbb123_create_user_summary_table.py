"""create user_summary table

Revision ID: b6f8f8fbb123
Revises: a1b2c3d4e5f6
Create Date: 2026-04-17 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "b6f8f8fbb123"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_summary",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("user_summary", sa.Text(), nullable=False),
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
            nullable=False,
        ),
        schema="ai_service",
    )
    op.create_index(
        "ix_user_summary_user_id",
        "user_summary",
        ["user_id"],
        schema="ai_service",
    )


def downgrade() -> None:
    op.drop_index("ix_user_summary_user_id", table_name="user_summary", schema="ai_service")
    op.drop_table("user_summary", schema="ai_service")
