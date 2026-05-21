from dataclasses import dataclass, field
from typing import Any


@dataclass
class FakeBeCoreClient:
    materials: dict[str, dict[str, Any]] = field(default_factory=dict)
    jobs: dict[str, dict[str, Any]] = field(default_factory=dict)
    messages: list[dict[str, Any]] = field(default_factory=list)

    def get_material(self, material_id: str) -> dict[str, Any]:
        return self.materials.get(
            material_id,
            {
                "id": material_id,
                "title": "Fixture material",
                "storageUrl": f"fixture://{material_id}.txt",
            },
        )

    def update_job_status(
        self,
        job_id: str,
        status: str,
        payload: dict[str, Any] | None = None,
    ) -> None:
        self.jobs[job_id] = {"jobId": job_id, "status": status, "payload": payload or {}}

    def append_assistant_message(self, session_id: str, content: str) -> dict[str, Any]:
        message = {
            "id": f"assistant-{len(self.messages) + 1}",
            "sessionId": session_id,
            "role": "assistant",
            "content": content,
        }
        self.messages.append(message)
        return message
