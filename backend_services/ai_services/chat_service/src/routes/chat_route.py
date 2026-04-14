import logging
import uuid
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db.deps import get_db
from src.schemas.chat_schema import ChatRequest, ChatSessionResponse
from src.services.chat_service import ChatService
from src.repositories.chat_session_repository import ChatSessionRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post(
    "/",
    summary="Streaming chat endpoint",
    description=(
        "Send a message and receive a streaming Server-Sent Events (SSE) response. "
        "The first event contains the session_id, followed by response chunks, "
        "and a final 'done' event. When session_id is null/omitted, a new session "
        "is created and its title is generated asynchronously."
    ),
    response_class=StreamingResponse,
)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    logger.info(
        "Chat request received: user=%s session=%s",
        request.user_id,
        request.session_id,
    )

    return StreamingResponse(
        ChatService.stream_chat(request=request, db=db),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
        },
    )


@router.get(
    "/sessions",
    summary="Get all sessions for a user",
    response_model=list[ChatSessionResponse],
)
async def get_all_sessions(
    user_id: uuid.UUID = Query(..., description="UUID of the user"),
    db: AsyncSession = Depends(get_db),
):
    repo = ChatSessionRepository(db)
    return await repo.get_by_user_id(user_id=user_id)


@router.get(
    "/sessions/{session_id}",
    summary="Get a single chat session",
    response_model=ChatSessionResponse,
)
async def get_single_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    repo = ChatSessionRepository(db)
    session = await repo.get_by_id(session_id=session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
