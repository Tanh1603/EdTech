from __future__ import annotations

from agents.clients.be_core import BeCoreCallContext
from agents.runtime.graph import AgentRuntime
from agents.workers.worker import JobMessage


class RoadmapWorker:
    def __init__(self, runtime: AgentRuntime) -> None:
        self.runtime = runtime

    def handle(self, message: JobMessage) -> dict[str, object]:
        user_id = str(message.payload.get("userId") or message.resource_id)
        class_id = str(message.payload.get("classId") or message.payload.get("class_id") or "")
        course_id = str(message.payload.get("courseId") or message.payload.get("course_id") or "")
        result = self.runtime.generate_roadmap(
            user_id=user_id,
            class_id=class_id,
            course_id=course_id,
            context=BeCoreCallContext(
                request_id=message.request_id,
                correlation_id=message.correlation_id,
                user_id=user_id,
                roles=("admin",),
                job_id=message.job_id,
            ),
            options=message.payload,
        )
        metadata = result.get("metadata", {})
        return {
            "userId": user_id,
            "classId": class_id,
            "courseId": course_id,
            "roadmap": metadata.get("roadmap", {}),
            "roadmapItems": metadata.get("roadmapItems", []),
            "usage": result.get("usage", {}),
        }
