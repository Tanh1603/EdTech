from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from google.protobuf.json_format import (  # pyright: ignore[reportMissingModuleSource]
    MessageToDict,
    ParseDict,
)
from google.protobuf.struct_pb2 import Struct  # pyright: ignore[reportMissingModuleSource]

from agents.grpc.errors import AiErrorCode
from agents.grpc.metadata import RequestMetadata


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


def unwrap_list_response(response: Any) -> list[dict[str, Any]]:
    return [from_struct(item) for item in getattr(response, "items", [])]


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


def ai_code_for_grpc_status(status_code: Any) -> AiErrorCode:
    name = getattr(status_code, "name", "")
    return {
        "INVALID_ARGUMENT": AiErrorCode.INVALID_ARGUMENT,
        "UNAUTHENTICATED": AiErrorCode.UNAUTHENTICATED,
        "PERMISSION_DENIED": AiErrorCode.PERMISSION_DENIED,
        "NOT_FOUND": AiErrorCode.NOT_FOUND,
        "DEADLINE_EXCEEDED": AiErrorCode.DEADLINE_EXCEEDED,
        "UNAVAILABLE": AiErrorCode.UNAVAILABLE,
    }.get(name, AiErrorCode.INTERNAL)
