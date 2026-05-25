from __future__ import annotations

from agents.clients.be_core import BeCoreCallContext
from agents.runtime.graph import AgentRuntime
from agents.workers.worker import JobMessage


class GradingWorker:
    def __init__(self, runtime: AgentRuntime) -> None:
        self.runtime = runtime

    def handle(self, message: JobMessage) -> dict[str, object]:
        context = _context_from_message(message)
        result = self.runtime.grade_submission(
            submission_id=message.resource_id,
            context=context,
            options=message.payload,
        )
        return {
            "submissionId": message.resource_id,
            "gradingResult": result.get("metadata", {}).get("gradingResult", {}),
            "usage": result.get("usage", {}),
        }


def _context_from_message(message: JobMessage) -> BeCoreCallContext:
    user_id = (
        message.payload.get("requestedBy")
        or message.payload.get("createdBy")
        or message.payload.get("userId")
        or message.payload.get("user_id")
        or message.payload.get("studentId")
        or message.payload.get("student_id")
    )
    return BeCoreCallContext(
        request_id=message.request_id,
        correlation_id=message.correlation_id,
        user_id=str(user_id) if user_id else None,
        roles=("admin",),
        job_id=message.job_id,
    )
