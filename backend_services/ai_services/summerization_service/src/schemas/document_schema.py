import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class DocumentAnalyzeRequest(BaseModel):
    """Request body for PATCH /api/document/analyze."""

    user_id: uuid.UUID = Field(..., description="UUID of the user / patient who owns the document")
    document_id: str = Field(..., description="Unique identifier of the document")
    document_url: str = Field(..., description="Publicly accessible URL of the document to summarize")


class DocumentAnalyzeResponse(BaseModel):
    """Response returned after successful document analysis."""

    document_id: str = Field(..., description="The document identifier supplied in the request")
    summary: str = Field(..., description="AI-generated summary of the document")


class DocumentSummaryRecord(BaseModel):
    """A single document summary record returned from the database."""

    id: uuid.UUID = Field(..., description="Primary key of the summary record")
    user_id: uuid.UUID = Field(..., description="Owner of the document")
    document_id: str = Field(..., description="Identifier of the document")
    document_summary: str = Field(..., description="AI-generated summary")
    created_datetime: datetime | None = None
    updated_datetime: datetime | None = None

    model_config = {"from_attributes": True}


class UserAnalyzeRequest(BaseModel):
    """Request body for POST /api/user/analyze."""

    user_id: uuid.UUID = Field(..., description="UUID of the user / patient")
    user_current_summary: str = Field(
        ...,
        description="The patient's existing health summary that will be updated",
    )
    user_new_content: str = Field(
        ...,
        description="New health information to be merged into the existing summary",
    )


class UserAnalyzeResponse(BaseModel):
    """Response returned after successful user health summary update."""

    user_id: uuid.UUID = Field(..., description="The user identifier supplied in the request")
    updated_summary: str = Field(..., description="AI-generated merged health summary")
