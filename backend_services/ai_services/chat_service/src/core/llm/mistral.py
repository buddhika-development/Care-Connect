from langchain_mistralai import ChatMistralAI, MistralAIEmbeddings
from src.config import config
import logging

logger = logging.getLogger(__name__)

class MistralService:

    def __init__(self):
        self.chatInstance = self.getMistralChatModel(config.mistral_chat_model)
        self.decisionInstance = self.getMistralChatModel(config.mistral_decision_model)
        self.embeddingInstance = self.getMistralEmbeddingModel(config.mistral_embedding_model)

    def getMistralChatModel(self, model_name:str) -> ChatMistralAI:
        try:
            return ChatMistralAI(
                api_key = config.mistral_api_key,
                model = model_name
            )
        except Exception as e:
            logger.error(f"Something went wrong in the mistral connection... {e}")
            raise
    
    def getMistralEmbeddingModel(self, model_name: str) -> MistralAIEmbeddings:
        try:
            return MistralAIEmbeddings(
                api_key= config.mistral_api_key,
                model= model_name
            )
        except Exception as e:
            logger.error("Something went wrong in mistral embedding connection... {e}")
            raise
    
    def getChatInstance(self):
        return self.chatInstance
    
    def getDecisionInstance(self):
        return self.decisionInstance

    def getEmbeddingInstance(self):
        return self.embeddingInstance
    
    def getCustomModel(self, custom_model_name : str) -> ChatMistralAI:
        return self.getMistralChatModel(
            model_name= custom_model_name
        )

mistral = MistralService()