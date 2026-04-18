import asyncio
import json
import logging
import uuid
from typing import AsyncGenerator

from langchain_core.messages import AIMessage, HumanMessage
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import config
from src.core.db.postgres_connection import AsyncSessionLocal
from src.core.llm.mistral import mistral
from src.prompts.chat_prompt import chat_prompt_template
from src.prompts.title_prompt import title_prompt_template
from src.repositories.chat_message_repository import ChatMessageRepository
from src.repositories.chat_session_repository import ChatSessionRepository
from src.schemas.chat_schema import ChatRequest

logger = logging.getLogger(__name__)

_streaming_llm = mistral.getMistralChatModel(
    model_name=config.mistral_chat_model
)
_title_llm = mistral.getDecisionInstance()


class ChatService:
    """Handles streaming chat responses with persistent conversation history."""

    @staticmethod
    async def stream_chat(
        request: ChatRequest,
        db: AsyncSession,
    ) -> AsyncGenerator[str, None]:
        """
        Async generator that yields SSE-formatted strings.

        Event sequence:
          1. {"type": "session_id", "data": "<uuid>"}
          2. {"type": "chunk",      "data": "<token>"} × N
          3. {"type": "done",       "data": ""}
          On error: {"type": "error", "data": "<message>"}

        After the stream ends:
          - User + assistant messages are persisted to DB (background task).
          - New sessions also get a generated title (background task).
        """
        session_repo = ChatSessionRepository(db)
        msg_repo = ChatMessageRepository(db)
        is_new_session = request.session_id is None

        # ── 1. Resolve or create session ────────────────────────────────────
        if is_new_session:
            session = await session_repo.create_session(user_id=request.user_id)
            await db.commit()
            session_id = session.id
        else:
            session_id = request.session_id

        # ── 2. Emit session_id as the very first event ───────────────────────
        yield ChatService._sse_event({"type": "session_id", "data": str(session_id)})

        # ── 3. Load prior conversation turns from DB ─────────────────────────
        history_records = await msg_repo.get_by_session_id(session_id)
        history = [
            HumanMessage(content=r.content)
            if r.role == "user"
            else AIMessage(content=r.content)
            for r in history_records
        ]
        next_message_index = len(history_records)

        # ── 4. Build prompt (system + history + current user message) ────────
        prompt_messages = chat_prompt_template.format_messages(
            history=history,
            message=request.message,
        )

        # ── 5. Stream LLM response ───────────────────────────────────────────
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

        # ── 6. Signal end of stream ──────────────────────────────────────────
        yield ChatService._sse_event({"type": "done", "data": ""})

        full_response = "".join(full_response_parts)

        # ── 7. Persist both turns (fire-and-forget) ──────────────────────────
        asyncio.create_task(
            ChatService._save_messages(
                session_id=session_id,
                user_message=request.message,
                assistant_message=full_response,
                base_index=next_message_index,
            )
        )

        # ── 8. Generate title for brand-new sessions (fire-and-forget) ───────
        if is_new_session:
            asyncio.create_task(
                ChatService._generate_and_save_title(
                    session_id=session_id,
                    message=request.message,
                )
            )

    # ── Private helpers ──────────────────────────────────────────────────────

    @staticmethod
    def _sse_event(payload: dict) -> str:
        """Format a dict as an SSE data line."""
        return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"

    @staticmethod
    async def _save_messages(
        session_id: uuid.UUID,
        user_message: str,
        assistant_message: str,
        base_index: int,
    ) -> None:
        """
        Persist the user turn (base_index) and assistant turn (base_index + 1).
        Runs in its own DB session so it is fully decoupled from the
        request-scoped session that is already closed by this point.
        """
        try:
            async with AsyncSessionLocal() as bg_db:
                repo = ChatMessageRepository(bg_db)
                await repo.create_message(
                    session_id=session_id,
                    role="user",
                    content=user_message,
                    message_index=base_index,
                )
                await repo.create_message(
                    session_id=session_id,
                    role="assistant",
                    content=assistant_message,
                    message_index=base_index + 1,
                )
                await bg_db.commit()

            logger.info("Persisted messages for session=%s (index %d, %d)", session_id, base_index, base_index + 1)
        except Exception as exc:
            logger.error("Failed to persist messages for session=%s: %s", session_id, exc)

    @staticmethod
    async def _generate_and_save_title(
        session_id: uuid.UUID,
        message: str,
    ) -> None:
        """
        Generate a short title from the first user message and save it.
        Runs in its own DB session, fully decoupled from the request scope.
        """
        try:
            prompt_messages = title_prompt_template.format_messages(message=message)
            response = await _title_llm.ainvoke(prompt_messages)
            title: str = response.content.strip()[:255]  # type: ignore[attr-defined]

            async with AsyncSessionLocal() as bg_db:
                repo = ChatSessionRepository(bg_db)
                await repo.update_session_title(session_id=session_id, title=title)

            logger.info("Title generated for session=%s → '%s'", session_id, title)
        except Exception as exc:
            logger.error("Title generation failed for session=%s: %s", session_id, exc)
