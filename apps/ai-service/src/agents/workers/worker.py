from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from agents.clients.be_core import BeCoreGrpcClient


@dataclass(frozen=True)
class JobMessage:
    job_id: str
    type: str
    resource_id: str
    payload: dict[str, Any]
    request_id: str | None = None
    correlation_id: str | None = None
    attempts: int = 1

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> JobMessage:
        body = payload.get("payload") if isinstance(payload.get("payload"), dict) else {}
        resource_id = (
            payload.get("resourceId")
            or payload.get("resource_id")
            or body.get("resourceId")
            or body.get("resource_id")
            or body.get("materialId")
            or body.get("submissionId")
            or body.get("userId")
            or ""
        )
        return cls(
            job_id=str(payload.get("jobId") or payload.get("job_id") or ""),
            type=str(payload.get("type") or body.get("type") or ""),
            resource_id=str(resource_id),
            payload=body,
            request_id=_optional_str(payload, "requestId") or _optional_str(payload, "request_id"),
            correlation_id=_optional_str(payload, "correlationId")
            or _optional_str(payload, "correlation_id"),
            attempts=int(payload.get("attempts") or body.get("attempts") or 1),
        )


JobHandler = Callable[[JobMessage], dict[str, Any]]


class Worker:
    def __init__(self, be_core: BeCoreGrpcClient) -> None:
        self.be_core = be_core

    def process(self, message: JobMessage, handler: JobHandler) -> dict[str, Any]:
        self.be_core.mark_job_running(message.job_id)
        try:
            result = handler(message)
        except Exception as error:
            self.be_core.mark_job_failed(message.job_id, {"message": str(error)})
            raise
        self.be_core.mark_job_succeeded(message.job_id, result)
        return result


def _optional_str(payload: dict[str, Any], key: str) -> str | None:
    value = payload.get(key)
    return value if isinstance(value, str) and value else None
