from fastapi import APIRouter

from ai_service.config.settings import Settings, get_settings

router = APIRouter(tags=["ops"])


@router.get("/ready")
def ready() -> dict[str, str]:
    settings: Settings = get_settings()
    return {
        "status": "ready",
        "aiGrpcUrl": settings.ai_grpc_url,
        "beCoreGrpcUrl": settings.be_core_grpc_url,
    }
