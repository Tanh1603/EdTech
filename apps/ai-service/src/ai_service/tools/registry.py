from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class ToolContext:
    request_id: str | None = None
    correlation_id: str | None = None
    user_id: str | None = None
    job_id: str | None = None


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


def create_default_registry() -> ToolRegistry:
    registry = ToolRegistry()
    registry.register(
        "chat.echo",
        lambda payload, _context: {"content": payload.get("content", "")},
    )
    registry.register(
        "materials.get",
        lambda payload, _context: {"materialId": payload["materialId"]},
    )
    registry.register(
        "jobs.status",
        lambda payload, _context: {"jobId": payload["jobId"], "status": "queued"},
    )
    registry.register(
        "retrieval.search",
        lambda payload, _context: {"query": payload.get("query", ""), "chunks": []},
    )
    registry.register(
        "storage.read",
        lambda payload, _context: {"url": payload.get("url", ""), "content": ""},
    )
    return registry
