from contextlib import asynccontextmanager
from fastapi import APIRouter, FastAPI
from src.config import config
from src.core.db.postgres_connection import engine
import logging

logging.basicConfig(
    level= logging.INFO,
    format= '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db_engine = engine
    logger.info("✅ Database connection pool started")

    yield

    await engine.dispose()
    logger.info("🛑 Database connection pool closed")
    
api_v1_router = APIRouter(prefix="/api/v1")

@api_v1_router.get("/")
def read_root() -> dict[str, str]:
    logger.info("Sucessfully reached the message")
    return {"service": "chat-service", "status": "running"}


@api_v1_router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}

app = FastAPI(
    title="Chat Service",
    version="0.1.0",
    lifespan= lifespan
)  
app.include_router(api_v1_router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", 
        host=config.host, 
        port=config.port, 
        reload=config.reload
    )
