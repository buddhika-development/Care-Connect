import asyncio
import json
import logging
import uuid
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from src.config import config
from src.core.llm.gemini import gemini
from src.prompts.chat_prompt import chat_prompt_template
from src.prompts.title_prompt import title_prompt_template
from src.repositories.chat_session_repository import ChatSessionRepository
from src.schemas.chat_schema import ChatRequest
from src.core.db.postgres_connection import AsyncSessionLocal

logger = logging.getLogger(__name__)

_streaming_llm = gemini.getGeminiStreamingChatModel(
    model_name=config.gemini_chat_model
)
_title_llm = gemini.getDecisionInstance()


class ChatService:
    """Handles streaming chat responses and async session title generation."""
    
    @staticmethod
    async def stream_chat(
        request: ChatRequest,
        db: AsyncSession,
    ) -> AsyncGenerator[str, None]:
        """
        Async generator that yields Server-Sent Event (SSE) formatted strings.

        Order:
          1. {"type": "session_id", "data": "<uuid>"}
          2. {"type": "chunk",      "data": "<token>"} × N
          3. {"type": "done",       "data": ""}
        Background: generate & persist session title.
        """
        repo = ChatSessionRepository(db)
        is_new_session = request.session_id is None

        # ── 1. Resolve or create session ────────────────────────────────
        if is_new_session:
            session = await repo.create_session(user_id=request.user_id)
            await db.commit()  # commit so the row is visible immediately
            session_id = session.id
        else:
            session_id = request.session_id

        # ── 2. Emit session_id as the very first SSE event ──────────────
        yield ChatService._sse_event({"type": "session_id", "data": str(session_id)})

        # ── 3. Build prompt and stream LLM response ─────────────────────
        prompt_messages = chat_prompt_template.format_messages(
            message=request.message
        )

        full_response_parts: list[str] = []
        try:
            async for chunk in _streaming_llm.astream(prompt_messages):
                token: str = chunk.content  # type: ignore[attr-defined]
                if token:
                    full_response_parts.append(token)
                    yield ChatService._sse_event({"type": "chunk", "data": token})
        except Exception as exc:
            logger.error("LLM streaming error: %s", exc)
            yield ChatService._sse_event({"type": "error", "data": str(exc)})
            return

        # ── 4. Signal end of stream ──────────────────────────────────────
        yield ChatService._sse_event({"type": "done", "data": ""})

        # ── 5. Fire-and-forget: generate title for new sessions ──────────
        if is_new_session:
            asyncio.create_task(
                ChatService._generate_and_save_title(
                    session_id=session_id,
                    message=request.message,
                )
            )

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _sse_event(payload: dict) -> str:
        """Format a dict as an SSE data line."""
        return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"

    @staticmethod
    async def _generate_and_save_title(
        session_id: uuid.UUID,
        message: str,
    ) -> None:
        """
        Run in the background (asyncio.create_task).
        Opens its own DB session so it is fully decoupled from the
        request-scoped session that is already closed by this point.
        """
        try:
            prompt_messages = title_prompt_template.format_messages(message=message)
            response = await _title_llm.ainvoke(prompt_messages)
            title: str = response.content.strip()[:255]  # type: ignore[attr-defined]

            async with AsyncSessionLocal() as bg_db:
                repo = ChatSessionRepository(bg_db)
                await repo.update_session_title(session_id=session_id, title=title)

            logger.info(
                "Background title generation complete: session=%s title='%s'",
                session_id,
                title,
            )
        except Exception as exc:
            logger.error(
                "Background title generation failed for session=%s: %s",
                session_id,
                exc,
            )
