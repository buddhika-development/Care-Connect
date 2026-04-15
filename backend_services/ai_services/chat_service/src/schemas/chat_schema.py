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


from datetime import datetime

class ChatSessionResponse(BaseModel):
    """Response model for a chat session."""
    id: uuid.UUID
    chat_title: str
    user_id: uuid.UUID
    created_datetime: datetime | None = None
    updated_datetime: datetime | None = None

    model_config = {
        "from_attributes": True
    }
