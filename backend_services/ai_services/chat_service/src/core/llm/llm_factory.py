from langchain_mistralai import ChatMistralAI
from langchain_core.language_models import BaseLanguageModel
import logging

logger = logging.getLogger(__name__)

class LLM:
    
    def __init__(self, llm_service: BaseLanguageModel):
        self.llm = llm_service
    
    def invoke(self, chat_prompt : str):
        try:
            return self.llm.invoke(chat_prompt)
        except Exception as e:
            logger.error(f"Something went wrong in llm manner.. {e}")
            raise