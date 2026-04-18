import logging
from langchain_mistralai import ChatMistralAI
from src.config import config

logger = logging.getLogger(__name__)


class MistralService:

    def getChatModel(self, model_name: str) -> ChatMistralAI:
        try:
            return ChatMistralAI(
                api_key=config.mistral_api_key,
                model=model_name,
            )
        except Exception as e:
            logger.error(f"Failed to initialise Mistral chat model: {e}")
            raise

    def getSummarizationModel(self) -> ChatMistralAI:
        return self.getChatModel(config.mistral_chat_model)


mistral = MistralService()
