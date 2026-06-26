from __future__ import annotations

from typing import Any

from agents.clients.be_core_common import BeCoreCallContext


class AcademicClientMixin:
    def get_classroom_lessons(
        self,
        classroom_id: str,
        context: BeCoreCallContext,
        published_only: bool = True,
    ) -> list[dict[str, Any]]:
        request = self._lessons_pb2.ClassroomLessonsQuery(
            classroom_id=classroom_id,
            published_only=published_only,
        )
        return self._call_list(self.lessons.GetClassroomLessons, request, context, True)
