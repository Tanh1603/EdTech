from __future__ import annotations

from agents.clients.be_core import BeCoreCallContext
from agents.workers.worker import JobMessage


def context_from_message(message: JobMessage) -> BeCoreCallContext:
    user_id = (
        message.payload.get("requestedBy")
        or message.payload.get("createdBy")
        or message.payload.get("userId")
        or message.payload.get("user_id")
        or ""
    )
    return BeCoreCallContext(
        request_id=message.request_id,
        correlation_id=message.correlation_id,
        user_id=str(user_id) if user_id else None,
        roles=("admin",),
        job_id=message.job_id,
    )


def log_extra(message: JobMessage, step: str) -> dict[str, object]:
    return {
        "component": "material_ingest_worker",
        "step": step,
        "jobId": message.job_id,
        "jobType": message.type,
        "materialId": message.resource_id,
        "requestId": message.request_id,
        "correlationId": message.correlation_id,
    }
