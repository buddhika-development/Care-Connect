from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from src.config import config

engine = create_async_engine(
    config.database_url,
    echo = config.db_echo
)

AsyncSessionLocal = async_sessionmaker(
    bind = engine,
    class_= AsyncSession,
    expire_on_commit= False
)

class Base(DeclarativeBase):
    metadata = MetaData(schema="ai_service")