import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    port = int(os.getenv("PORT", "8001"))
    host = os.getenv("HOST", "127.0.0.1")

    database_url = os.getenv("DATABASE_URL")

    gemini_api_key = os.getenv("GOOGLE_API_KEY")
    gemini_summarization_model = os.getenv("GOOGLE_SUMMARIZATION_MODEL", "gemini-2.5-flash")

    patient_service_url = os.getenv("PATIENT_SERVICE_URL", "http://localhost:3001")


class DevelopmentConfig(Config):
    reload = True
    db_echo = True


class ProductionConfig(Config):
    reload = False
    db_echo = False


config = (
    DevelopmentConfig()
    if os.getenv("FASTAPI_ENV") == "development"
    else ProductionConfig()
)
