import logging

from docling.document_converter import DocumentConverter

from src.core.llm.gemini import gemini
from src.core.llm.llm_factory import LLM
from src.prompts.summarization_prompt import summarization_prompt_template
from src.prompts.user_summary_prompt import user_summary_prompt_template
from src.schemas.document_schema import (
    DocumentAnalyzeRequest,
    DocumentAnalyzeResponse,
    UserAnalyzeRequest,
    UserAnalyzeResponse,
)

logger = logging.getLogger(__name__)

_summarization_llm = LLM(gemini.getSummarizationModel())


class SummarizationService:
    """Handles document loading via Docling and AI-powered summarization."""

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
    async def analyze_document(
        request: DocumentAnalyzeRequest,
    ) -> DocumentAnalyzeResponse:
        """
        Full pipeline:
          1. Convert the document at `document_url` to Markdown via Docling.
          2. Feed the Markdown content into Gemini with the summarization prompt.
          3. Return the structured summary response.
        """
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

        prompt_messages = summarization_prompt_template.format_messages(
            document_content=document_content
        )

        try:
            summary = await _summarization_llm.ainvoke(prompt_messages)
        except Exception as exc:
            logger.error(
                "LLM summarization failed for document_id=%s: %s",
                request.document_id,
                exc,
            )
            raise

        logger.info(
            "Summarization complete for document_id=%s — %d characters",
            request.document_id,
            len(summary),
        )

        return DocumentAnalyzeResponse(
            document_id=request.document_id,
            summary=summary,
        )

    @staticmethod
    async def analyze_user(
        request: UserAnalyzeRequest,
    ) -> UserAnalyzeResponse:
        """
        Merge an existing patient health summary with new health content using Gemini.

        Pipeline:
          1. Build a prompt combining the current summary and the new content.
          2. Invoke Gemini to produce a merged, updated summary.
          3. Return the structured response.
        """
        prompt_messages = user_summary_prompt_template.format_messages(
            current_summary=request.user_current_summary,
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

        return UserAnalyzeResponse(
            user_id=request.user_id,
            updated_summary=updated_summary,
        )
