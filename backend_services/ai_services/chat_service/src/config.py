import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    port = int(os.getenv('PORT', '8000'))
    host = os.getenv('HOST', '127.0.0.1')
    database_url = os.getenv("DATABASE_URL")
    
    gemini_api_key= os.getenv('GOOGLE_API_KEY')
    gemini_chat_model = os.getenv('GOOGLE_CHAT_MODEL')
    gemini_embedding_model = os.getenv('GOOGLE_EMBEDING_MODEL')
    gemini_decision_model = os.getenv('GOOGLE_DECISION_MODEL')    

    mistral_api_key = os.getenv('MISTRAL_API_KEY')
    mistral_chat_model = os.getenv('MISTRAL_CHAT_MODEL')
    mistral_decision_model = os.getenv('MISTRAL_DECISION_MODEL')
    mistral_embedding_model = os.getenv('MISTRAL_EMBEDING_MODEL')
class DevelopmentConfig(Config):
    reload = True
    db_echo = True

class ProductionConfig(Config):
    reload = False
    db_echo= False

config = DevelopmentConfig() if os.getenv('FASTAPI_ENV') == "development" else ProductionConfig()