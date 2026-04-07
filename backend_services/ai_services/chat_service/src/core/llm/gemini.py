from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from src.config import config
import logging

logger = logging.getLogger(__name__)

class GeminiService:

    def __init__(self):
        self.chatInstance = self.getGeminiChatModel(config.gemini_chat_model)
        self.decisionInstance = self.getGeminiChatModel(config.gemini_decision_model)
        self.embeddingInstance = self.getGeminiEmbeddingModel(config.gemini_embedding_model)

    def getGeminiChatModel(self, model_name:str) -> ChatGoogleGenerativeAI:
        try:
            return ChatGoogleGenerativeAI(
                api_key = config.gemini_api_key,
                model = model_name
            )
        except Exception as e:
            logger.error(f"Something went wrong in the gemini connection... {e}")
            raise
    
    def getGeminiStreamingChatModel(self, model_name: str) -> ChatGoogleGenerativeAI:
        try:
            return ChatGoogleGenerativeAI(
                api_key = config.gemini_api_key,
                model = model_name,
                streaming = True
            )
        except Exception as e:
            logger.error(f"Something went wrong in the gemini streaming connection... {e}")
            raise

    def getGeminiEmbeddingModel(self, model_name: str) -> GoogleGenerativeAIEmbeddings:
        try:
            return GoogleGenerativeAIEmbeddings(
                api_key= config.gemini_api_key,
                model= model_name
            )
        except Exception as e:
            logger.error("Something went wrong in gemini embedding connection... {e}")
            raise
    
    def getChatInstance(self):
        return self.chatInstance
    
    def getDecisionInstance(self):
        return self.decisionInstance

    def getEmbeddingInstance(self):
        return self.embeddingInstance
    
    def getCustomModel(self, custom_model_name : str) -> ChatGoogleGenerativeAI:
        return self.getGeminiChatModel(
            model_name= custom_model_name
        )

gemini = GeminiService()