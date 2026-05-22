from collections.abc import Iterator
from dataclasses import dataclass

from agents.rag.retrieval import Retriever


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
    def __init__(self, retriever: Retriever | None = None) -> None:
        self.retriever = retriever

    def search_material_context(
        self,
        query: str,
        top_k: int = 5,
        material_id: str | None = None,
    ) -> dict[str, object]:
        if not self.retriever:
            return {
                "chunks": [],
                "metadata": {
                    "query": query,
                    "source": "not-configured",
                    "materialId": material_id,
                },
            }

        results = self.retriever.search(query=query, top_k=top_k, material_id=material_id)
        return {
            "chunks": [
                {
                    "chunkId": result.chunk_id,
                    "content": result.content,
                    "score": result.score,
                    "citation": result.citation,
                }
                for result in results
            ],
            "metadata": {
                "query": query,
                "source": "qdrant",
                "materialId": material_id,
                "topK": top_k,
            },
        }
