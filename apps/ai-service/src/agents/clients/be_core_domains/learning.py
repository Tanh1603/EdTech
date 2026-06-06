from __future__ import annotations

from typing import Any

from agents.clients.be_core_common import BeCoreCallContext, to_struct


class LearningClientMixin:
    def create_roadmap(
        self,
        body: dict[str, Any],
        context: BeCoreCallContext,
    ) -> dict[str, Any]:
        request = self._roadmaps_pb2.RoadmapBodyRequest(body=to_struct(body))
        return self._call_object(self.roadmaps.CreateRoadmap, request, context, True)

    def update_roadmap(
        self,
        roadmap_id: str,
        body: dict[str, Any],
        context: BeCoreCallContext,
    ) -> dict[str, Any]:
        request = self._roadmaps_pb2.RoadmapUpdateRequest(
            roadmap_id=roadmap_id,
            body=to_struct(body),
        )
        return self._call_object(self.roadmaps.UpdateRoadmap, request, context, True)

    def create_roadmap_item(
        self,
        roadmap_id: str,
        body: dict[str, Any],
        context: BeCoreCallContext,
    ) -> dict[str, Any]:
        request = self._roadmaps_pb2.RoadmapItemCreateRequest(
            roadmap_id=roadmap_id,
            body=to_struct(body),
        )
        return self._call_object(self.roadmaps.CreateRoadmapItem, request, context, True)

    def get_mastery_by_class(
        self,
        class_id: str,
        context: BeCoreCallContext,
    ) -> list[dict[str, Any]]:
        if class_id:
            request = self._mastery_pb2.ClassIdRequest(class_id=class_id)
            return self._call_list(self.mastery.GetMasteryByClass, request, context, True)
        return self._call_list(
            self.mastery.GetMyMastery,
            self._common_json_pb2.EmptyRequest(),
            context,
            True,
        )
