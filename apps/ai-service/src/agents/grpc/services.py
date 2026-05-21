from collections.abc import Iterator
from dataclasses import dataclass


@dataclass(frozen=True)
class PlaceholderChatResponse:
    assistant_message_id: str
    content: str
    model: str = "fake-ai-service"


class AiOrchestratorService:
    def generate_chat_response(self, session_id: str, message_id: str) -> PlaceholderChatResponse:
        return PlaceholderChatResponse(
            assistant_message_id=f"assistant-{message_id or 'placeholder'}",
            content=f"Placeholder response for session {session_id or 'unknown'}",
        )

    def stream_chat_response(self, text: str) -> Iterator[str]:
        yield from text.split()

    def accept_job(self, job_type: str, resource_id: str) -> dict[str, str]:
        return {
            "jobId": f"{job_type}:{resource_id}",
            "status": "queued",
            "type": job_type,
            "resourceId": resource_id,
        }


class AiJobsService:
    def get_job_status(self, job_id: str) -> dict[str, str]:
        return {"jobId": job_id, "status": "queued", "type": "ai.placeholder"}

    def cancel_job(self, job_id: str) -> dict[str, str]:
        return {"jobId": job_id, "status": "cancelled", "type": "ai.placeholder"}


class AiRagService:
    def search_material_context(self, query: str) -> dict[str, object]:
        return {"chunks": [], "metadata": {"query": query, "source": "placeholder"}}
