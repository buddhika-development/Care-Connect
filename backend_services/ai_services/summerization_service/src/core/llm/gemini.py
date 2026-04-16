import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from src.config import config

logger = logging.getLogger(__name__)


class GeminiService:

    def getChatModel(self, model_name: str) -> ChatGoogleGenerativeAI:
        try:
            return ChatGoogleGenerativeAI(
                api_key=config.gemini_api_key,
                model=model_name,
            )
        except Exception as e:
            logger.error(f"Failed to initialise Gemini chat model: {e}")
            raise

    def getSummarizationModel(self) -> ChatGoogleGenerativeAI:
        return self.getChatModel(config.gemini_summarization_model)


gemini = GeminiService()
