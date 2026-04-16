import logging
from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import config
from src.routes.document_route import router as document_router
from src.routes.user_route import router as user_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


api_router = APIRouter(prefix="/api")


@api_router.get("/")
def read_root() -> dict[str, str]:
    return {"service": "summarization-service", "status": "running"}


@api_router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


app = FastAPI(
    title="Summarization Service",
    version="0.1.0",
    description="Care Connect document summarization microservice powered by Docling and Gemini.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(document_router, prefix="/api")
app.include_router(user_router, prefix="/api")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=config.host,
        port=config.port,
        reload=config.reload,
    )
