from pydantic import BaseModel, Field, HttpUrl


class DocumentAnalyzeRequest(BaseModel):
    """Request body for PATCH /api/document/analyze."""

    document_id: str = Field(..., description="Unique identifier of the document")
    document_url: str = Field(..., description="Publicly accessible URL of the document to summarize")


class DocumentAnalyzeResponse(BaseModel):
    """Response returned after successful document analysis."""

    document_id: str = Field(..., description="The document identifier supplied in the request")
    summary: str = Field(..., description="AI-generated summary of the document")
