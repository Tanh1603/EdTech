import logging
from concurrent import futures
from typing import Any

from agents.grpc.auth import ServiceTokenInterceptor
from agents.grpc.servicers import register_ai_services
from config.logging import configure_logging
from config.settings import Settings, get_settings

logger = logging.getLogger(__name__)


def create_grpc_server(settings: Settings | None = None) -> Any:
    import grpc

    active_settings = settings or get_settings()
    active_settings.validate_runtime("grpc")
    server = grpc.server(
        futures.ThreadPoolExecutor(max_workers=10),
        interceptors=(ServiceTokenInterceptor(active_settings),),
    )
    register_ai_services(server)
    bound_port = server.add_insecure_port(active_settings.ai_grpc_url)
    if bound_port == 0:
        raise RuntimeError(f"Failed to bind AI gRPC server to {active_settings.ai_grpc_url}")
    return server


def serve(settings: Settings | None = None) -> None:
    configure_logging()
    active_settings = settings or get_settings()
    server = create_grpc_server(settings)
    server.start()
    logger.info(
        "AI gRPC server listening",
        extra={
            "component": "grpc.server",
            "step": "server.started",
            "host": active_settings.ai_grpc_url,
        },
    )
    server.wait_for_termination()
