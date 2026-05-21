from concurrent import futures
from typing import Any

from ai_service.config.settings import Settings, get_settings


def create_grpc_server(settings: Settings | None = None) -> Any:
    """Create a gRPC server.

    Generated Python protobuf modules are required before real service handlers
    can be registered. Run `uv run python -m ai_service.contracts.generate_proto`
    first.
    """

    import grpc

    active_settings = settings or get_settings()
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    # Service registration will be expanded as production handlers replace the
    # deterministic placeholder services generated from shared contracts.
    server.add_insecure_port(active_settings.ai_grpc_url)
    return server


def serve(settings: Settings | None = None) -> None:
    server = create_grpc_server(settings)
    server.start()
    server.wait_for_termination()
