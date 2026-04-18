import logging
from langchain_core.language_models import BaseLanguageModel

logger = logging.getLogger(__name__)


class LLM:
    """Thin wrapper around a LangChain chat model instance."""

    def __init__(self, llm_service: BaseLanguageModel):
        self.llm = llm_service

    def invoke(self, prompt: str) -> str:
        try:
            response = self.llm.invoke(prompt)
            return response.content  # type: ignore[attr-defined]
        except Exception as e:
            logger.error(f"LLM invocation error: {e}")
            raise

    async def ainvoke(self, prompt: str) -> str:
        try:
            response = await self.llm.ainvoke(prompt)
            return response.content  # type: ignore[attr-defined]
        except Exception as e:
            logger.error(f"Async LLM invocation error: {e}")
            raise
