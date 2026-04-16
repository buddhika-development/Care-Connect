import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    port = int(os.getenv("PORT", "8001"))
    host = os.getenv("HOST", "127.0.0.1")

    gemini_api_key = os.getenv("GOOGLE_API_KEY")
    gemini_summarization_model = os.getenv("GOOGLE_SUMMARIZATION_MODEL", "gemini-2.5-flash-lite")


class DevelopmentConfig(Config):
    reload = True


class ProductionConfig(Config):
    reload = False


config = (
    DevelopmentConfig()
    if os.getenv("FASTAPI_ENV") == "development"
    else ProductionConfig()
)
