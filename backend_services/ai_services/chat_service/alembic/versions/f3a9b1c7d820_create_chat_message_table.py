"""create chat_message table

Revision ID: f3a9b1c7d820
Revises: cd82db98bb6a
Create Date: 2026-04-16 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f3a9b1c7d820"
down_revision: Union[str, Sequence[str], None] = "cd82db98bb6a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create chat_message table to persist individual conversation turns."""
    op.create_table(
        "chat_message",
        sa.Column("session_id", sa.UUID(), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("message_index", sa.Integer(), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_datetime",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_datetime",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["session_id"],
            ["chat_session.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_chat_message_session_id"),
        "chat_message",
        ["session_id"],
        unique=False,
    )


def downgrade() -> None:
    """Drop chat_message table."""
    op.drop_index(op.f("ix_chat_message_session_id"), table_name="chat_message")
    op.drop_table("chat_message")
