import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from docling.document_converter import DocumentConverter

from src.core.llm.mistral import mistral
from src.core.llm.llm_factory import LLM
from src.core.http.patient_client import patient_client
from src.prompts.summarization_prompt import summarization_prompt_template
from src.prompts.user_summary_prompt import user_summary_prompt_template
from src.repositories.document_summary_repository import DocumentSummaryRepository
from src.repositories.user_summary_repository import UserSummaryRepository
from src.schemas.document_schema import (
    DocumentAnalyzeRequest,
    DocumentAnalyzeResponse,
    UserAnalyzeRequest,
    UserAnalyzeResponse,
)

logger = logging.getLogger(__name__)

_summarization_llm = LLM(mistral.getSummarizationModel())


class SummarizationService:
    """Handles document loading via Docling and AI-powered summarization."""

    # ── Private helpers ───────────────────────────────────────────────────────

    @staticmethod
    def _extract_document_content(document_url: str) -> str:
        """
        Use Docling to fetch and convert a document at the given URL into
        clean Markdown text suitable for LLM ingestion.
        """
        logger.info("Converting document from URL: %s", document_url)
        converter = DocumentConverter()
        doc = converter.convert(document_url).document
        markdown = doc.export_to_markdown()
        logger.info(
            "Document conversion complete — %d characters extracted", len(markdown)
        )
        return markdown

    @staticmethod
    async def _merge_patient_summary(
        user_id: str,
        new_document_summary: str,
        fallback_current_summary: str | None = None,
    ) -> str:
        """
        Fetch the patient's current summary from the Patient Service and merge
        it with the new document summary.  If the patient has no existing
        summary, the document summary is used as-is.
        """
        try:
            current_summary = await patient_client.get_patient_summary(user_id)
        except Exception:
            current_summary = fallback_current_summary

        if not current_summary:
            logger.info(
                "No existing patient summary for user_id=%s — using document summary directly",
                user_id,
            )
            return new_document_summary

        prompt_messages = user_summary_prompt_template.format_messages(
            current_summary=current_summary,
            new_content=new_document_summary,
        )
        merged = await _summarization_llm.ainvoke(prompt_messages)
        logger.info(
            "Merged patient summary for user_id=%s — %d chars", user_id, len(merged)
        )
        return merged

    # ── Public methods ────────────────────────────────────────────────────────

    @staticmethod
    async def analyze_document(
        request: DocumentAnalyzeRequest,
        db: AsyncSession,
    ) -> DocumentAnalyzeResponse:
        """
        Full pipeline for PATCH /api/document/analyze:

          1. Convert the document at `document_url` to Markdown via Docling.
          2. Generate a document summary with Mistral.
          3. Persist (user_id, document_id, document_summary) in the DB.
          4. Fetch the patient's current summary from the Patient Service.
          5. Merge current patient summary + new document summary via Mistral.
          6. PATCH the Patient Service with the updated patient summary.
          7. Return document_id + document summary.
        """
        # ── Step 1: Extract document content ─────────────────────────────────
        try:
            document_content = SummarizationService._extract_document_content(
                request.document_url
            )
        except Exception as exc:
            logger.error(
                "Docling conversion failed for document_id=%s url=%s: %s",
                request.document_id,
                request.document_url,
                exc,
            )
            raise

        # ── Step 2: Generate document summary ────────────────────────────────
        prompt_messages = summarization_prompt_template.format_messages(
            document_content=document_content
        )
        try:
            document_summary = await _summarization_llm.ainvoke(prompt_messages)
        except Exception as exc:
            logger.error(
                "LLM summarization failed for document_id=%s: %s",
                request.document_id,
                exc,
            )
            raise

        logger.info(
            "Document summary generated for document_id=%s — %d characters",
            request.document_id,
            len(document_summary),
        )

        # ── Step 3: Persist document summary in DB ───────────────────────────
        try:
            repo = DocumentSummaryRepository(db)
            await repo.create(
                user_id=request.user_id,
                document_id=request.document_id,
                document_summary=document_summary,
            )
            await db.commit()
        except Exception as exc:
            logger.error(
                "Failed to persist document summary for document_id=%s: %s",
                request.document_id,
                exc,
            )
            raise

        # ── Steps 4–6: Merge, upsert local user summary, and push to Patient Service ────
        # The Patient Service update is best-effort, but local user summary persistence
        # is mandatory for every document analyze request.
        user_summary_repo = UserSummaryRepository(db)
        local_summary_record = await user_summary_repo.get_by_user_id(request.user_id)
        local_current_summary = (
            local_summary_record.user_summary if local_summary_record else None
        )

        updated_patient_summary = await SummarizationService._merge_patient_summary(
            user_id=str(request.user_id),
            new_document_summary=document_summary,
            fallback_current_summary=local_current_summary,
        )

        await user_summary_repo.upsert(
            user_id=request.user_id,
            user_summary=updated_patient_summary,
        )
        await db.commit()

        try:
            await patient_client.update_patient_summary(
                user_id=str(request.user_id),
                patient_summary=updated_patient_summary,
            )
        except Exception as exc:
            logger.warning(
                "Patient profile update skipped for user_id=%s — Patient Service "
                "may be unavailable (%s). Document and user summaries were stored successfully.",
                request.user_id,
                exc,
            )

        return DocumentAnalyzeResponse(
            document_id=request.document_id,
            summary=document_summary,
        )

    @staticmethod
    async def analyze_user(
        request: UserAnalyzeRequest,
        db: AsyncSession,
    ) -> UserAnalyzeResponse:
        """
        Merge an existing patient health summary with new health content using Mistral.

        Pipeline:
          1. Build a prompt combining the current summary and the new content.
          2. Invoke Mistral to produce a merged, updated summary.
          3. Return the structured response.
        """
        user_summary_repo = UserSummaryRepository(db)
        existing_summary_record = await user_summary_repo.get_by_user_id(request.user_id)

        current_summary = request.user_current_summary
        if current_summary is None and existing_summary_record:
            current_summary = existing_summary_record.user_summary

        prompt_messages = user_summary_prompt_template.format_messages(
            current_summary=current_summary or "",
            new_content=request.user_new_content,
        )

        try:
            updated_summary = await _summarization_llm.ainvoke(prompt_messages)
        except Exception as exc:
            logger.error(
                "User summary update failed for user_id=%s: %s",
                request.user_id,
                exc,
            )
            raise

        logger.info(
            "User summary updated for user_id=%s — %d characters",
            request.user_id,
            len(updated_summary),
        )

        await user_summary_repo.upsert(
            user_id=request.user_id,
            user_summary=updated_summary,
        )
        await db.commit()

        return UserAnalyzeResponse(
            user_id=request.user_id,
            updated_summary=updated_summary,
        )

    @staticmethod
    async def get_user_details(user_id: uuid.UUID, db: AsyncSession):
        user_summary_repo = UserSummaryRepository(db)
        return await user_summary_repo.get_by_user_id(user_id)
