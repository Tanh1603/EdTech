from __future__ import annotations

from importlib import import_module
from typing import Any

from agents.clients.be_core_common import (
    BeCoreCallContext,
    ai_code_for_grpc_status,
    from_struct,
    to_struct,
    unwrap_delete_response,
    unwrap_list_response,
    unwrap_object_response,
    unwrap_page_response,
)
from agents.clients.be_core_domains import (
    AssessmentClientMixin,
    ChatClientMixin,
    JobsClientMixin,
    LearningClientMixin,
    MaterialsClientMixin,
    StorageClientMixin,
)
from agents.grpc.errors import AiErrorCode, AiServiceError
from config.settings import Settings, get_settings
from contracts.generated import ensure_generated_proto_path


def _load_generated_modules() -> dict[str, Any]:
    ensure_generated_proto_path()
    return {
        "grpc": import_module("grpc"),
        "materials_pb2": import_module("learning.materials_pb2"),
        "materials_pb2_grpc": import_module("learning.materials_pb2_grpc"),
        "jobs_pb2": import_module("jobs.jobs_pb2"),
        "jobs_pb2_grpc": import_module("jobs.jobs_pb2_grpc"),
        "messages_pb2": import_module("chat.messages_pb2"),
        "messages_pb2_grpc": import_module("chat.messages_pb2_grpc"),
        "sessions_pb2": import_module("chat.sessions_pb2"),
        "sessions_pb2_grpc": import_module("chat.sessions_pb2_grpc"),
        "analytics_pb2": import_module("chat.analytics_pb2"),
        "analytics_pb2_grpc": import_module("chat.analytics_pb2_grpc"),
        "storage_pb2": import_module("storage.storage_pb2"),
        "storage_pb2_grpc": import_module("storage.storage_pb2_grpc"),
        "submissions_pb2": import_module("assessments.submissions_pb2"),
        "submissions_pb2_grpc": import_module("assessments.submissions_pb2_grpc"),
        "results_pb2": import_module("assessments.results_pb2"),
        "results_pb2_grpc": import_module("assessments.results_pb2_grpc"),
        "roadmaps_pb2": import_module("learning.roadmaps_pb2"),
        "roadmaps_pb2_grpc": import_module("learning.roadmaps_pb2_grpc"),
        "mastery_pb2": import_module("learning.mastery_pb2"),
        "mastery_pb2_grpc": import_module("learning.mastery_pb2_grpc"),
        "common_json_pb2": import_module("common.json_pb2"),
    }


class BeCoreGrpcClient(
    MaterialsClientMixin,
    ChatClientMixin,
    AssessmentClientMixin,
    LearningClientMixin,
    JobsClientMixin,
    StorageClientMixin,
):
    def __init__(self, settings: Settings | None = None, channel: Any | None = None) -> None:
        self.settings = settings or get_settings()
        modules = _load_generated_modules()
        grpc = modules["grpc"]
        self._channel = channel or grpc.insecure_channel(self.settings.be_core_grpc_url)
        self._grpc = grpc
        self._materials_pb2 = modules["materials_pb2"]
        self._jobs_pb2 = modules["jobs_pb2"]
        self._messages_pb2 = modules["messages_pb2"]
        self._sessions_pb2 = modules["sessions_pb2"]
        self._analytics_pb2 = modules["analytics_pb2"]
        self._storage_pb2 = modules["storage_pb2"]
        self._submissions_pb2 = modules["submissions_pb2"]
        self._results_pb2 = modules["results_pb2"]
        self._roadmaps_pb2 = modules["roadmaps_pb2"]
        self._mastery_pb2 = modules["mastery_pb2"]
        self._common_json_pb2 = modules["common_json_pb2"]
        self.materials = modules["materials_pb2_grpc"].LearningMaterialsServiceStub(
            self._channel
        )
        self.jobs = modules["jobs_pb2_grpc"].JobsServiceStub(self._channel)
        self.chat_sessions = modules["sessions_pb2_grpc"].ChatSessionsServiceStub(
            self._channel
        )
        self.chat_messages = modules["messages_pb2_grpc"].ChatMessagesServiceStub(
            self._channel
        )
        self.chat_analytics = modules["analytics_pb2_grpc"].ChatAnalyticsServiceStub(
            self._channel
        )
        self.storage = modules["storage_pb2_grpc"].StorageServiceStub(self._channel)
        self.assessment_submissions = modules[
            "submissions_pb2_grpc"
        ].AssessmentSubmissionsServiceStub(self._channel)
        self.assessment_results = modules[
            "results_pb2_grpc"
        ].AssessmentResultsServiceStub(self._channel)
        self.roadmaps = modules["roadmaps_pb2_grpc"].LearningRoadmapsServiceStub(
            self._channel
        )
        self.mastery = modules["mastery_pb2_grpc"].LearningMasteryServiceStub(
            self._channel
        )

    def close(self) -> None:
        close = getattr(self._channel, "close", None)
        if close:
            close()

    def _call_object(
        self,
        method: Any,
        request: Any,
        context: BeCoreCallContext | None,
        require_user: bool,
    ) -> dict[str, Any]:
        return unwrap_object_response(
            self._call(method, request, context, require_user=require_user)
        )

    def _call_page(
        self,
        method: Any,
        request: Any,
        context: BeCoreCallContext | None,
        require_user: bool,
    ) -> dict[str, Any]:
        return unwrap_page_response(
            self._call(method, request, context, require_user=require_user)
        )

    def _call_list(
        self,
        method: Any,
        request: Any,
        context: BeCoreCallContext | None,
        require_user: bool,
    ) -> list[dict[str, Any]]:
        return unwrap_list_response(
            self._call(method, request, context, require_user=require_user)
        )

    def _call_delete(
        self,
        method: Any,
        request: Any,
        context: BeCoreCallContext | None,
        require_user: bool,
    ) -> dict[str, Any]:
        return unwrap_delete_response(
            self._call(method, request, context, require_user=require_user)
        )

    def _call(
        self,
        method: Any,
        request: Any,
        context: BeCoreCallContext | None,
        require_user: bool,
    ) -> Any:
        try:
            return method(
                request,
                metadata=self._metadata(context, require_user=require_user),
                timeout=self.settings.be_core_grpc_timeout_seconds,
            )
        except self._grpc.RpcError as error:
            raise AiServiceError(
                ai_code_for_grpc_status(error.code()),
                error.details() or "BE Core gRPC call failed",
            ) from error

    def _metadata(
        self,
        context: BeCoreCallContext | None,
        require_user: bool,
    ) -> list[tuple[str, str]]:
        if require_user and (not context or not context.user_id):
            raise AiServiceError(
                AiErrorCode.UNAUTHENTICATED,
                "Delegated user metadata is required for this BE Core tool",
            )
        if not self.settings.service_token:
            raise AiServiceError(
                AiErrorCode.UNAUTHENTICATED,
                "SERVICE_TOKEN is required for BE Core gRPC calls",
            )

        metadata = [("x-service-token", self.settings.service_token)]
        if not context:
            return metadata
        if context.request_id:
            metadata.append(("x-request-id", context.request_id))
        if context.correlation_id:
            metadata.append(("x-correlation-id", context.correlation_id))
        if context.user_id:
            metadata.append(("x-user-id", context.user_id))
        if context.roles:
            metadata.append(("x-user-roles", ",".join(context.roles)))
        if context.permissions:
            metadata.append(("x-user-permissions", ",".join(context.permissions)))
        if context.job_id:
            metadata.append(("x-ai-job-id", context.job_id))
        return metadata


__all__ = [
    "BeCoreCallContext",
    "BeCoreGrpcClient",
    "from_struct",
    "to_struct",
]
