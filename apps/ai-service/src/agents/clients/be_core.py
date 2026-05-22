from __future__ import annotations

from dataclasses import dataclass, field
from importlib import import_module
from typing import Any

from google.protobuf.json_format import (  # pyright: ignore[reportMissingModuleSource]
    MessageToDict,
    ParseDict,
)
from google.protobuf.struct_pb2 import Struct  # pyright: ignore[reportMissingModuleSource]

from agents.grpc.errors import AiErrorCode, AiServiceError
from agents.grpc.metadata import RequestMetadata
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
        "storage_pb2": import_module("storage.storage_pb2"),
        "storage_pb2_grpc": import_module("storage.storage_pb2_grpc"),
    }


def to_struct(value: dict[str, Any] | None) -> Struct:
    return ParseDict(value or {}, Struct())


def from_struct(value: Struct | None) -> dict[str, Any]:
    if value is None:
        return {}
    return MessageToDict(value, preserving_proto_field_name=False)


def unwrap_object_response(response: Any) -> dict[str, Any]:
    return from_struct(getattr(response, "data", None))


def unwrap_page_response(response: Any) -> dict[str, Any]:
    return {
        "items": [from_struct(item) for item in getattr(response, "items", [])],
        "pagination": MessageToDict(
            getattr(response, "pagination", None),
            preserving_proto_field_name=True,
        )
        if getattr(response, "pagination", None)
        else {},
    }


def unwrap_delete_response(response: Any) -> dict[str, Any]:
    return {
        "id": getattr(response, "id", ""),
        "deleted": bool(getattr(response, "deleted", False)),
    }


@dataclass(frozen=True)
class BeCoreCallContext:
    request_id: str | None = None
    correlation_id: str | None = None
    user_id: str | None = None
    roles: tuple[str, ...] = field(default_factory=tuple)
    permissions: tuple[str, ...] = field(default_factory=tuple)
    job_id: str | None = None

    @classmethod
    def from_request_metadata(cls, metadata: RequestMetadata) -> BeCoreCallContext:
        return cls(
            request_id=metadata.request_id,
            correlation_id=metadata.correlation_id,
            user_id=metadata.user_id,
            roles=tuple(metadata.roles),
            permissions=tuple(metadata.permissions),
            job_id=metadata.ai_job_id,
        )


class BeCoreGrpcClient:
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
        self._storage_pb2 = modules["storage_pb2"]
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
        self.storage = modules["storage_pb2_grpc"].StorageServiceStub(self._channel)

    def close(self) -> None:
        close = getattr(self._channel, "close", None)
        if close:
            close()

    def get_material(
        self,
        material_id: str,
        context: BeCoreCallContext,
    ) -> dict[str, Any]:
        request = self._materials_pb2.MaterialIdRequest(material_id=material_id)
        return self._call_object(self.materials.GetMaterialDetail, request, context, True)

    def get_material_chunks(
        self,
        material_id: str,
        context: BeCoreCallContext,
        page: int = 1,
        limit: int = 50,
    ) -> dict[str, Any]:
        request = self._materials_pb2.MaterialChunksQuery(
            material_id=material_id,
            page=page,
            limit=limit,
        )
        return self._call_page(self.materials.GetMaterialChunks, request, context, True)

    def get_chunk_detail(
        self,
        material_id: str,
        chunk_id: str,
        context: BeCoreCallContext,
    ) -> dict[str, Any]:
        request = self._materials_pb2.MaterialChunkIdRequest(
            material_id=material_id,
            chunk_id=chunk_id,
        )
        return self._call_object(self.materials.GetChunkDetail, request, context, True)

    def append_assistant_message(
        self,
        session_id: str,
        content: str,
        context: BeCoreCallContext,
    ) -> dict[str, Any]:
        request = self._messages_pb2.MessageCreateRequest(
            session_id=session_id,
            body=to_struct({"role": "assistant", "content": content}),
        )
        return self._call_object(self.chat_messages.CreateMessage, request, context, True)

    def get_messages(
        self,
        session_id: str,
        context: BeCoreCallContext,
        page: int = 1,
        limit: int = 50,
        before: str | None = None,
    ) -> dict[str, Any]:
        request = self._messages_pb2.MessagesQuery(
            session_id=session_id,
            page=page,
            limit=limit,
            before=before or "",
        )
        return self._call_page(self.chat_messages.GetMessages, request, context, True)

    def create_job(
        self,
        job_type: str,
        payload: dict[str, Any] | None = None,
        context: BeCoreCallContext | None = None,
        priority: int = 0,
        max_attempts: int = 0,
        created_by: str | None = None,
        resource_type: str | None = None,
        resource_id: str | None = None,
    ) -> dict[str, Any]:
        request = self._jobs_pb2.CreateJobRequest(
            type=job_type,
            payload=to_struct(payload),
            priority=priority,
            max_attempts=max_attempts,
            request_id=context.request_id if context else "",
            correlation_id=context.correlation_id if context else "",
            created_by=created_by or (context.user_id if context else "") or "",
            resource_type=resource_type or "",
            resource_id=resource_id or "",
        )
        return self._call_object(self.jobs.CreateJob, request, context, False)

    def get_job_status(
        self,
        job_id: str,
        context: BeCoreCallContext,
    ) -> dict[str, Any]:
        request = self._jobs_pb2.JobIdRequest(job_id=job_id)
        return self._call_object(self.jobs.GetJobStatus, request, context, True)

    def mark_job_running(self, job_id: str) -> dict[str, Any]:
        request = self._jobs_pb2.JobIdRequest(job_id=job_id)
        return self._call_object(self.jobs.MarkJobRunning, request, None, False)

    def mark_job_succeeded(
        self,
        job_id: str,
        result: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        request = self._jobs_pb2.CompleteJobRequest(
            job_id=job_id,
            result=to_struct(result),
        )
        return self._call_object(self.jobs.MarkJobSucceeded, request, None, False)

    def mark_job_failed(
        self,
        job_id: str,
        error: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        request = self._jobs_pb2.FailJobRequest(job_id=job_id, error=to_struct(error))
        return self._call_object(self.jobs.MarkJobFailed, request, None, False)

    def delete_storage_file(
        self,
        public_id: str,
        context: BeCoreCallContext,
    ) -> dict[str, Any]:
        request = self._storage_pb2.DeleteFileRequest(public_id=public_id)
        return self._call_delete(self.storage.DeleteFile, request, context, True)

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
            )
        except self._grpc.RpcError as error:
            raise AiServiceError(
                _ai_code_for_grpc_status(error.code()),
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


def _ai_code_for_grpc_status(status_code: Any) -> AiErrorCode:
    name = getattr(status_code, "name", "")
    return {
        "INVALID_ARGUMENT": AiErrorCode.INVALID_ARGUMENT,
        "UNAUTHENTICATED": AiErrorCode.UNAUTHENTICATED,
        "PERMISSION_DENIED": AiErrorCode.PERMISSION_DENIED,
        "NOT_FOUND": AiErrorCode.NOT_FOUND,
        "DEADLINE_EXCEEDED": AiErrorCode.DEADLINE_EXCEEDED,
        "UNAVAILABLE": AiErrorCode.UNAVAILABLE,
    }.get(name, AiErrorCode.INTERNAL)
