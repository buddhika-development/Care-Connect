import uuid
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Request body for the /chat endpoint."""

    message: str = Field(..., min_length=1, description="The user's message")
    user_id: uuid.UUID = Field(..., description="UUID of the authenticated user")
    session_id: uuid.UUID | None = Field(
        default=None,
        description="Existing session ID. Omit or pass null to start a new session.",
    )
