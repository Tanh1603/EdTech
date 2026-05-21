from fastapi import FastAPI

from ai_service.api.health import router as health_router
from ai_service.api.metrics import router as metrics_router
from ai_service.api.readiness import router as readiness_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="EdTech AI Service",
        description="Internal AI orchestration, RAG, and worker service.",
        version="0.1.0",
    )
    app.include_router(health_router)
    app.include_router(readiness_router)
    app.include_router(metrics_router)
    return app


app = create_app()


def main() -> None:
    import uvicorn

    uvicorn.run("ai_service.main:app", host="0.0.0.0", port=8090, reload=False)
