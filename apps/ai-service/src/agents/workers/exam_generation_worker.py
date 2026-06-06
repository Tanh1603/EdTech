from __future__ import annotations

from agents.clients.be_core import BeCoreCallContext
from agents.orchestrator.graph import AgentRuntime
from agents.workers.worker import JobMessage


class ExamGenerationWorker:
    def __init__(self, runtime: AgentRuntime) -> None:
        self.runtime = runtime

    def handle(self, message: JobMessage) -> dict[str, object]:
        exam_id = str(message.payload.get("examId") or message.resource_id)
        context = _context_from_message(message)
        result = self.runtime.generate_exam(
            exam_id=exam_id,
            context=context,
            options=message.payload,
        )
        return {
            "examId": exam_id,
            "questions": result.get("metadata", {}).get("questions", []),
            "usage": result.get("usage", {}),
        }


def _context_from_message(message: JobMessage) -> BeCoreCallContext:
    user_id = (
        message.payload.get("requestedBy")
        or message.payload.get("createdBy")
        or message.payload.get("userId")
        or message.payload.get("user_id")
    )
    return BeCoreCallContext(
        request_id=message.request_id,
        correlation_id=message.correlation_id,
        user_id=str(user_id) if user_id else None,
        roles=("admin",),
        job_id=message.job_id,
    )
