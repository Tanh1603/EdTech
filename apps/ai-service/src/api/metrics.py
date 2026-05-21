from fastapi import APIRouter, Response

router = APIRouter(tags=["ops"])


@router.get("/metrics")
def metrics() -> Response:
    body = (
        "# HELP ai_service_up AI service process liveness\n"
        "# TYPE ai_service_up gauge\n"
        "ai_service_up 1\n"
    )
    return Response(content=body, media_type="text/plain; version=0.0.4")
