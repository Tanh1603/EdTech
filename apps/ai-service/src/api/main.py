import logging

from fastapi import FastAPI, Response, status
from qdrant_client import QdrantClient
from redis import Redis

from config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

app = FastAPI(
    title="EdTech AI Service Operations API",
    description="HTTP Operations API for health and readiness checks",
    version="0.1.0",
)

@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """Liveness check endpoint."""
    return {
        "status": "healthy",
        "service": "ai-service",
        "environment": settings.environment,
    }

@app.get("/ready")
def readiness_check(response: Response):
    """Readiness check endpoint that verifies dependencies (Redis & Qdrant)."""
    checks = {}
    is_ready = True

    # 1. Check Redis
    try:
        redis_client = Redis.from_url(settings.redis_url, socket_timeout=2)
        redis_client.ping()
        checks["redis"] = "connected"
    except Exception as e:
        logger.error(f"Readiness check failed: Redis connection error: {e}")
        checks["redis"] = f"error: {e}"
        is_ready = False

    # 2. Check Qdrant
    try:
        # qdrant_url typically looks like http://localhost:6333
        qdrant_client = QdrantClient(url=settings.qdrant_url, timeout=2)
        # Verify collection list or simple health check
        qdrant_client.get_collections()
        checks["qdrant"] = "connected"
    except Exception as e:
        logger.error(f"Readiness check failed: Qdrant connection error: {e}")
        checks["qdrant"] = f"error: {e}"
        is_ready = False

    if not is_ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "unready",
            "checks": checks,
        }

    return {
        "status": "ready",
        "checks": checks,
    }

def serve():
    import uvicorn
    settings.validate_runtime("http")
    logger.info(f"Starting HTTP health server on port {settings.http_port}")
    uvicorn.run(app, host="0.0.0.0", port=settings.http_port)

if __name__ == "__main__":
    serve()
