from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from agents.clients.be_core import BeCoreCallContext, BeCoreGrpcClient


@dataclass(frozen=True)
class ToolContext:
    request_id: str | None = None
    correlation_id: str | None = None
    user_id: str | None = None
    roles: tuple[str, ...] = ()
    permissions: tuple[str, ...] = ()
    job_id: str | None = None

    def to_be_core_context(self) -> BeCoreCallContext:
        return BeCoreCallContext(
            request_id=self.request_id,
            correlation_id=self.correlation_id,
            user_id=self.user_id,
            roles=self.roles,
            permissions=self.permissions,
            job_id=self.job_id,
        )


@dataclass
class ToolAuditRecord:
    tool_name: str
    request_id: str | None
    correlation_id: str | None
    job_id: str | None


ToolHandler = Callable[[dict[str, Any], ToolContext], Any]


@dataclass
class ToolRegistry:
    _tools: dict[str, ToolHandler] = field(default_factory=dict)
    audit_records: list[ToolAuditRecord] = field(default_factory=list)

    def register(self, name: str, handler: ToolHandler) -> None:
        if name in self._tools:
            raise ValueError(f"Tool already registered: {name}")
        self._tools[name] = handler

    def call(self, name: str, payload: dict[str, Any], context: ToolContext) -> Any:
        if name not in self._tools:
            raise KeyError(f"Unknown tool: {name}")
        self.audit_records.append(
            ToolAuditRecord(
                tool_name=name,
                request_id=context.request_id,
                correlation_id=context.correlation_id,
                job_id=context.job_id,
            )
        )
        return self._tools[name](payload, context)


def create_default_registry(be_core_client: BeCoreGrpcClient) -> ToolRegistry:
    registry = ToolRegistry()
    registry.register(
        "materials.get",
        lambda payload, context: be_core_client.get_material(
            required_str(payload, "materialId"),
            context.to_be_core_context(),
        ),
    )
    registry.register(
        "materials.chunks",
        lambda payload, context: be_core_client.get_material_chunks(
            required_str(payload, "materialId"),
            context.to_be_core_context(),
            page=int(payload.get("page") or 1),
            limit=int(payload.get("limit") or 50),
        ),
    )
    registry.register(
        "materials.chunk",
        lambda payload, context: be_core_client.get_chunk_detail(
            required_str(payload, "materialId"),
            required_str(payload, "chunkId"),
            context.to_be_core_context(),
        ),
    )
    registry.register(
        "chat.messages",
        lambda payload, context: be_core_client.get_messages(
            required_str(payload, "sessionId"),
            context.to_be_core_context(),
            page=int(payload.get("page") or 1),
            limit=int(payload.get("limit") or 50),
            before=optional_str(payload, "before"),
        ),
    )
    registry.register(
        "chat.append_assistant",
        lambda payload, context: be_core_client.append_assistant_message(
            required_str(payload, "sessionId"),
            required_str(payload, "content"),
            context.to_be_core_context(),
        ),
    )
    registry.register(
        "jobs.create",
        lambda payload, context: be_core_client.create_job(
            required_str(payload, "type"),
            payload=optional_dict(payload, "payload"),
            context=context.to_be_core_context(),
            priority=int(payload.get("priority") or 0),
            max_attempts=int(payload.get("maxAttempts") or 0),
            created_by=optional_str(payload, "createdBy"),
            resource_type=optional_str(payload, "resourceType"),
            resource_id=optional_str(payload, "resourceId"),
        ),
    )
    registry.register(
        "jobs.status",
        lambda payload, context: be_core_client.get_job_status(
            required_str(payload, "jobId"),
            context.to_be_core_context(),
        ),
    )
    registry.register(
        "jobs.running",
        lambda payload, _context: be_core_client.mark_job_running(
            required_str(payload, "jobId"),
        ),
    )
    registry.register(
        "jobs.succeeded",
        lambda payload, _context: be_core_client.mark_job_succeeded(
            required_str(payload, "jobId"),
            optional_dict(payload, "result"),
        ),
    )
    registry.register(
        "jobs.failed",
        lambda payload, _context: be_core_client.mark_job_failed(
            required_str(payload, "jobId"),
            optional_dict(payload, "error"),
        ),
    )
    registry.register(
        "storage.delete",
        lambda payload, context: be_core_client.delete_storage_file(
            required_str(payload, "publicId"),
            context.to_be_core_context(),
        ),
    )
    return registry


def required_str(payload: dict[str, Any], key: str) -> str:
    value = payload.get(key)
    if not isinstance(value, str) or not value:
        raise ValueError(f"Missing required tool payload field: {key}")
    return value


def optional_str(payload: dict[str, Any], key: str) -> str | None:
    value = payload.get(key)
    return value if isinstance(value, str) and value else None


def optional_dict(payload: dict[str, Any], key: str) -> dict[str, Any] | None:
    value = payload.get(key)
    return value if isinstance(value, dict) else None
