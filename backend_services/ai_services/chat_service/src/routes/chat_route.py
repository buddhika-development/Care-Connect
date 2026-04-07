import logging
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db.deps import get_db
from src.schemas.chat_schema import ChatRequest
from src.services.chat_service import ChatService

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
            "Connection": "keep-alive",
        },
    )
