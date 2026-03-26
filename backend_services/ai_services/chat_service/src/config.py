import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    port = int(os.getenv('PORT', '8000'))
    host = os.getenv('HOST', '127.0.0.1')
    database_url = os.getenv("DATABASE_URL")

class DevelopmentConfig(Config):
    reload = True
    db_echo = True

class ProductionConfig(Config):
    reload = False
    db_echo= False

config = DevelopmentConfig() if os.getenv('FASTAPI_ENV') == "development" else ProductionConfig()