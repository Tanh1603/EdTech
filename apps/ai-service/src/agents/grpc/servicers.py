from __future__ import annotations

from typing import Any

from agents.grpc.errors import AiServiceError, grpc_status_for
from agents.grpc.services import (
    AiJobsService,
    AiOrchestratorService,
    AiRagService,
    context_from_grpc,
    options_from_struct,
)
from contracts.generated import ensure_generated_proto_path


def register_ai_services(server: Any) -> None:
    ensure_generated_proto_path()
    from contracts.generated.ai import jobs_pb2_grpc, orchestrator_pb2_grpc, rag_pb2_grpc

    orchestrator_pb2_grpc.add_AiOrchestratorServiceServicer_to_server(
        OrchestratorServicer(),
        server,
    )
    rag_pb2_grpc.add_AiRagServiceServicer_to_server(RagServicer(), server)
    jobs_pb2_grpc.add_AiJobsServiceServicer_to_server(JobsServicer(), server)


class OrchestratorServicer:
    def __init__(self) -> None:
        self.service = AiOrchestratorService()

    def GenerateChatResponse(self, request: Any, context: Any) -> Any:
        from contracts.generated.ai import orchestrator_pb2

        try:
            response = self.service.generate_chat_response(
                session_id=request.session_id,
                message_id=request.message_id,
                request_context=context_from_grpc(context, user_id=request.user_id),
                use_rag=bool(request.use_rag),
                top_k=int(request.top_k or 0),
                options=options_from_struct(request.options),
            )
            return orchestrator_pb2.ChatGenerationResponse(
                assistant_message_id=response.assistant_message_id,
                content=response.content,
                citations=[
                    _citation_proto(orchestrator_pb2, citation)
                    for citation in response.citations
                ],
                usage=_usage_proto(orchestrator_pb2, response.usage),
                metadata=_struct(response.metadata),
            )
        except AiServiceError as error:
            context.abort(grpc_status_for(error.code), error.message)

    def StreamChatResponse(self, request: Any, context: Any) -> Any:
        from contracts.generated.ai import orchestrator_pb2

        try:
            for token in self.service.stream_chat_response(
                session_id=request.session_id,
                message_id=request.message_id,
                request_context=context_from_grpc(context, user_id=request.user_id),
                use_rag=bool(request.use_rag),
                top_k=int(request.top_k or 0),
                options=options_from_struct(request.options),
            ):
                yield orchestrator_pb2.ChatToken(
                    text=str(token.get("text") or ""),
                    citations=[
                        _citation_proto(orchestrator_pb2, citation)
                        for citation in token.get("citations", [])
                    ],
                    is_final=bool(token.get("isFinal")),
                    assistant_message_id=str(token.get("assistantMessageId") or ""),
                )
        except AiServiceError as error:
            context.abort(grpc_status_for(error.code), error.message)

    def GenerateRoadmap(self, request: Any, context: Any) -> Any:
        from contracts.generated.common import envelope_pb2

        payload = {
            **options_from_struct(request.options),
            "userId": request.user_id,
            "classId": request.class_id,
            "courseId": request.course_id,
        }
        job = self.service.accept_job(
            "ai.roadmap.generate",
            "user",
            request.user_id,
            payload,
            context_from_grpc(context, user_id=request.user_id),
        )
        return _job_response(envelope_pb2, job)

    def GradeSubmission(self, request: Any, context: Any) -> Any:
        from contracts.generated.common import envelope_pb2

        payload = {
            **options_from_struct(request.options),
            "submissionId": request.submission_id,
            "requestedBy": request.requested_by,
        }
        job = self.service.accept_job(
            "ai.assessment.grade",
            "assessment_submission",
            request.submission_id,
            payload,
            context_from_grpc(context, user_id=request.requested_by),
        )
        return _job_response(envelope_pb2, job)

    def IngestMaterial(self, request: Any, context: Any) -> Any:
        from contracts.generated.common import envelope_pb2

        payload = {
            **options_from_struct(request.options),
            "materialId": request.material_id,
            "requestedBy": request.requested_by,
        }
        job = self.service.accept_job(
            "ai.material.ingest",
            "learning_material",
            request.material_id,
            payload,
            context_from_grpc(context, user_id=request.requested_by),
        )
        return _job_response(envelope_pb2, job)


class RagServicer:
    def __init__(self) -> None:
        self.service = AiRagService()

    def SearchMaterialContext(self, request: Any, context: Any) -> Any:
        from contracts.generated.ai import rag_pb2

        try:
            response = self.service.search_material_context(
                query=request.query,
                top_k=int(request.top_k or 5),
                material_ids=list(request.material_ids),
            )
            return rag_pb2.RagSearchResponse(
                chunks=[
                    rag_pb2.RagChunk(
                        material_id=str(chunk.get("materialId") or ""),
                        chunk_id=str(chunk.get("chunkId") or ""),
                        title=str(chunk.get("title") or ""),
                        content=str(chunk.get("content") or ""),
                        order_no=int(chunk.get("orderNo") or 0),
                        score=float(chunk.get("score") or 0.0),
                        source=_struct(chunk.get("source", {})),
                        payload=_struct(chunk.get("payload", {})),
                    )
                    for chunk in response["chunks"]
                ],
                metadata=_struct(response["metadata"]),
            )
        except AiServiceError as error:
            context.abort(grpc_status_for(error.code), error.message)


class JobsServicer:
    def __init__(self) -> None:
        self.service = AiJobsService()

    def GetJobStatus(self, request: Any, context: Any) -> Any:
        from google.protobuf.struct_pb2 import Struct

        from contracts.generated.ai import jobs_pb2

        try:
            job = self.service.get_job_status(
                job_id=request.job_id,
                request_context=context_from_grpc(context),
            )
            result_struct = Struct()
            result_struct.update(job.get("result") or {})

            error_struct = Struct()
            error_struct.update(job.get("error") or {})

            return jobs_pb2.AiJobStatus(
                job_id=str(job.get("id") or job.get("jobId") or ""),
                type=str(job.get("type") or ""),
                status=str(job.get("status") or ""),
                resource_id=str(job.get("resourceId") or ""),
                resource_type=str(job.get("resourceType") or ""),
                attempts=int(job.get("attempts") or 0),
                result=result_struct,
                error=error_struct,
                created_at=str(job.get("createdAt") or ""),
                updated_at=str(job.get("updatedAt") or ""),
            )
        except AiServiceError as error:
            context.abort(grpc_status_for(error.code), error.message)
        except Exception as error:
            context.abort(grpc_status_for("internal"), str(error))

    def CancelJob(self, request: Any, context: Any) -> Any:
        from google.protobuf.struct_pb2 import Struct

        from contracts.generated.ai import jobs_pb2

        try:
            job = self.service.cancel_job(
                job_id=request.job_id,
                request_context=context_from_grpc(context),
            )
            result_struct = Struct()
            result_struct.update(job.get("result") or {})

            error_struct = Struct()
            error_struct.update(job.get("error") or {})

            return jobs_pb2.AiJobStatus(
                job_id=str(job.get("id") or job.get("jobId") or ""),
                type=str(job.get("type") or ""),
                status=str(job.get("status") or ""),
                resource_id=str(job.get("resourceId") or ""),
                resource_type=str(job.get("resourceType") or ""),
                attempts=int(job.get("attempts") or 0),
                result=result_struct,
                error=error_struct,
                created_at=str(job.get("createdAt") or ""),
                updated_at=str(job.get("updatedAt") or ""),
            )
        except AiServiceError as error:
            context.abort(grpc_status_for(error.code), error.message)
        except Exception as error:
            context.abort(grpc_status_for("internal"), str(error))


def _job_response(envelope_pb2: Any, job: dict[str, Any]) -> Any:
    return envelope_pb2.JobQueuedResponse(
        job_id=job["jobId"],
        status=job["status"],
        type=job["type"],
        resource_id=job["resourceId"],
    )


def _struct(value: dict[str, Any]) -> Any:
    from google.protobuf.struct_pb2 import Struct

    struct = Struct()
    struct.update(value or {})
    return struct


def _citation_proto(orchestrator_pb2: Any, citation: dict[str, Any]) -> Any:
    return orchestrator_pb2.Citation(
        material_id=str(citation.get("materialId") or citation.get("material_id") or ""),
        chunk_id=str(citation.get("chunkId") or citation.get("chunk_id") or ""),
        title=str(citation.get("title") or ""),
        order_no=int(citation.get("orderNo") or citation.get("order_no") or 0),
        source=_struct(citation.get("source", {})),
    )


def _usage_proto(orchestrator_pb2: Any, usage: dict[str, Any]) -> Any:
    input_tokens = int(usage.get("inputTokens") or usage.get("input_tokens") or 0)
    output_tokens = int(usage.get("outputTokens") or usage.get("output_tokens") or 0)
    return orchestrator_pb2.TokenUsage(
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        total_tokens=int(usage.get("totalTokens") or input_tokens + output_tokens),
        model=str(usage.get("model") or ""),
    )
