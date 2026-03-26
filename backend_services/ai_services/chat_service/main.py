from fastapi import FastAPI
import logging

logging.basicConfig(
    level= logging.INFO,
    format= '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = FastAPI(title="Chat Service", version="0.1.0")
logger = logging.getLogger(__name__)

@app.get("/api/v1/")
def read_root() -> dict[str, str]:
    logger.info("Sucessfully reached the message")
    return {"service": "chat-service", "status": "running"}


@app.get("/api/v1/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
