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


class DocumentSummaryByIdRequest(BaseModel):
    """Request body for POST /api/document/summary."""

    document_id: str = Field(..., description="Unique identifier of the document")


class UserAnalyzeRequest(BaseModel):
    """Request body for POST /api/user/analyze."""

    user_id: uuid.UUID = Field(..., description="UUID of the user / patient")
    user_current_summary: str | None = Field(
        None,
        description=(
            "Optional existing health summary. If omitted, the service uses the "
            "currently stored summary for the user (if available)."
        ),
    )
    user_new_content: str = Field(
        ...,
        description="New health information to be merged into the existing summary",
    )


class UserAnalyzeResponse(BaseModel):
    """Response returned after successful user health summary update."""

    user_id: uuid.UUID = Field(..., description="The user identifier supplied in the request")
    updated_summary: str = Field(..., description="AI-generated merged health summary")


class UserDetailsResponse(BaseModel):
    """Persisted summary details for a user."""

    id: uuid.UUID = Field(..., description="Primary key of the user summary record")
    user_id: uuid.UUID = Field(..., description="User identifier")
    user_summary: str = Field(..., description="Latest stored user summary")
    created_datetime: datetime | None = None
    updated_datetime: datetime | None = None

    model_config = {"from_attributes": True}


class DoctorSemanticRequest(BaseModel):
    """Request body for PATCH /api/v1/doctor/semantic."""

    doctor_id: str = Field(..., description="Unique identifier of the doctor")
    doctor_bio: str = Field(..., description="Doctor biography / profile text to embed")


class DoctorSemanticResponse(BaseModel):
    """Response returned after the doctor embedding is generated and stored."""

    success: bool = Field(..., description="Whether the operation succeeded")
    message: str = Field(..., description="Human-readable result message")
    data: dict = Field(..., description="Doctor profile data returned by the Doctor Service")
