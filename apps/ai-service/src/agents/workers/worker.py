import logging
from collections.abc import Callable
from dataclasses import dataclass
from time import perf_counter
from typing import Any

from agents.clients.be_core import BeCoreGrpcClient

logger = logging.getLogger(__name__)


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


class GrpcCommunicationError(Exception):
    """Ném ra khi không thể kết nối tới gRPC của Backend Core để cập nhật trạng thái Job."""
    pass


class Worker:
    def __init__(self, be_core: BeCoreGrpcClient) -> None:
        self.be_core = be_core

    def process(self, message: JobMessage, handler: JobHandler) -> dict[str, Any]:
        started = perf_counter()
        logger.info(
            "Job processing started",
            extra={
                "component": "worker",
                "step": "job.running",
                "jobId": message.job_id,
                "jobType": message.type,
                "materialId": message.resource_id
                if message.type == "ai.material.ingest"
                else None,
                "requestId": message.request_id,
                "correlationId": message.correlation_id,
            },
        )
        try:
            self.be_core.mark_job_running(message.job_id)
        except Exception as error:
            logger.error(f"Failed to report job running to Backend Core: {error}")
            raise GrpcCommunicationError(str(error)) from error

        try:
            result = handler(message)
        except Exception as error:
            duration_ms = round((perf_counter() - started) * 1000)
            logger.exception(
                "Job processing failed",
                extra={
                    "component": "worker",
                    "step": "job.failed",
                    "jobId": message.job_id,
                    "jobType": message.type,
                    "materialId": message.resource_id
                    if message.type == "ai.material.ingest"
                    else None,
                    "durationMs": duration_ms,
                },
            )
            try:
                self.be_core.mark_job_failed(message.job_id, {"message": str(error)})
            except Exception as grpc_err:
                logger.error(f"Failed to report job failure to Backend Core: {grpc_err}")
                raise GrpcCommunicationError(str(error)) from grpc_err
            raise

        try:
            self.be_core.mark_job_succeeded(message.job_id, result)
        except Exception as grpc_err:
            logger.error(f"Failed to report job success to Backend Core: {grpc_err}")
            raise GrpcCommunicationError(str(grpc_err)) from grpc_err

        duration_ms = round((perf_counter() - started) * 1000)
        logger.info(
            "Job processing succeeded",
            extra={
                "component": "worker",
                "step": "job.succeeded",
                "jobId": message.job_id,
                "jobType": message.type,
                "materialId": message.resource_id
                if message.type == "ai.material.ingest"
                else None,
                "durationMs": duration_ms,
            },
        )
        return result


def _optional_str(payload: dict[str, Any], key: str) -> str | None:
    value = payload.get(key)
    return value if isinstance(value, str) and value else None
