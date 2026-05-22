from concurrent import futures
from typing import Any

from agents.grpc.services import AiOrchestratorService
from config.settings import Settings, get_settings
from contracts.generated import ensure_generated_proto_path


def create_grpc_server(settings: Settings | None = None) -> Any:
    """Create a gRPC server.

    Generated Python protobuf modules are required before real service handlers
    can be registered. Run `uv run python -m ai_service.contracts.generate_proto`
    first.
    """

    import grpc

    active_settings = settings or get_settings()
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    _register_ai_services(server)
    server.add_insecure_port(active_settings.ai_grpc_url)
    return server


def serve(settings: Settings | None = None) -> None:
    server = create_grpc_server(settings)
    server.start()
    server.wait_for_termination()


def _register_ai_services(server: Any) -> None:
    ensure_generated_proto_path()

    from ai import orchestrator_pb2, orchestrator_pb2_grpc
    from common import envelope_pb2
    from google.protobuf.struct_pb2 import Struct

    class OrchestratorServicer(orchestrator_pb2_grpc.AiOrchestratorServiceServicer):
        def __init__(self) -> None:
            self.service = AiOrchestratorService()

        def GenerateChatResponse(self, request: Any, context: Any) -> Any:
            response = self.service.generate_chat_response(
                request.session_id,
                request.message_id,
            )
            metadata = Struct()
            metadata.update({"model": response.model})
            return orchestrator_pb2.ChatGenerationResponse(
                assistant_message_id=response.assistant_message_id,
                content=response.content,
                metadata=metadata,
            )

        def StreamChatResponse(self, request: Any, context: Any) -> Any:
            text = f"Placeholder response for message {request.message_id or 'unknown'}"
            for token in self.service.stream_chat_response(text):
                yield orchestrator_pb2.ChatToken(text=f"{token} ", is_final=False)
            yield orchestrator_pb2.ChatToken(
                is_final=True,
                assistant_message_id=f"assistant-{request.message_id or 'placeholder'}",
            )

        def GenerateRoadmap(self, request: Any, context: Any) -> Any:
            return envelope_pb2.JobQueuedResponse(
                job_id=f"ai.roadmap.generate:{request.user_id}",
                status="queued",
                type="ai.roadmap.generate",
                resource_id=request.user_id,
            )

        def GradeSubmission(self, request: Any, context: Any) -> Any:
            return envelope_pb2.JobQueuedResponse(
                job_id=f"ai.assessment.grade:{request.submission_id}",
                status="queued",
                type="ai.assessment.grade",
                resource_id=request.submission_id,
            )

        def IngestMaterial(self, request: Any, context: Any) -> Any:
            return envelope_pb2.JobQueuedResponse(
                job_id=f"ai.material.ingest:{request.material_id}",
                status="queued",
                type="ai.material.ingest",
                resource_id=request.material_id,
            )

    orchestrator_pb2_grpc.add_AiOrchestratorServiceServicer_to_server(
        OrchestratorServicer(),
        server,
    )
