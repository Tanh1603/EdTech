from __future__ import annotations

from typing import Any

from agents.orchestrator.state import RuntimeState
from agents.profiles.common import parse_json_object
from agents.prompts import get_prompt_registry
from agents.providers.llm_provider import LlmProvider
from agents.tools.registry import ToolRegistry


class LearningPathAgentProfile:
    def __init__(self, llm_provider: LlmProvider, registry: ToolRegistry) -> None:
        self.llm_provider = llm_provider
        self.registry = registry
        self.prompts = get_prompt_registry()

    def run(self, state: RuntimeState) -> RuntimeState:
        context = state.get("tool_context")
        tool_results = state.get("tool_results", {})
        prompt = self.prompts.render(
            "learning_path.prompt",
            {
                "user_id": state.get("user_id", ""),
                "class_id": state.get("class_id", ""),
                "course_id": state.get("course_id", ""),
                "mastery": tool_results.get("learning.mastery", {}),
                "analytics": tool_results.get("chat.classroom_analytics", {}),
                "options": state.get("options", {}),
            },
        )
        response = self.llm_provider.generate(prompt)
        draft = parse_json_object(response.text)
        roadmap_body = self._roadmap_body(state, draft, response.text)
        roadmap: dict[str, Any] = {}
        created_items: list[dict[str, Any]] = []

        if context is not None:
            roadmap = self.registry.call(
                "roadmaps.create",
                {"body": roadmap_body},
                context,
            )
            roadmap_id = str(roadmap.get("id") or roadmap.get("roadmapId") or "")
            for item in _items_from_draft(draft):
                if roadmap_id:
                    created_items.append(
                        self.registry.call(
                            "roadmaps.items.create",
                            {"roadmapId": roadmap_id, "body": item},
                            context,
                        )
                    )

        return {
            **state,
            "content": response.text,
            "metadata": {
                **state.get("metadata", {}),
                "roadmap": roadmap,
                "roadmapItems": created_items,
            },
            "usage": {
                "inputTokens": response.input_tokens,
                "outputTokens": response.output_tokens,
                "totalTokens": response.input_tokens + response.output_tokens,
                "model": response.model,
            },
        }

    def _roadmap_body(self, state: RuntimeState, draft: dict[str, Any], raw: str) -> dict[str, Any]:
        return {
            "userId": state.get("user_id", ""),
            "classId": state.get("class_id", ""),
            "courseId": state.get("course_id", ""),
            "title": str(draft.get("title") or "AI Learning Roadmap"),
            "description": str(draft.get("description") or raw),
            "status": "draft",
            "source": "ai-service",
        }


def _items_from_draft(draft: dict[str, Any]) -> list[dict[str, Any]]:
    items = draft.get("items")
    if not isinstance(items, list):
        return []
    normalized: list[dict[str, Any]] = []
    for index, item in enumerate(items, start=1):
        if not isinstance(item, dict):
            continue
        normalized.append(
            {
                "title": str(item.get("title") or f"Step {index}"),
                "description": str(item.get("description") or ""),
                "orderNo": int(item.get("orderNo") or index),
                "estimatedMinutes": int(item.get("estimatedMinutes") or 30),
                "source": "ai-service",
            }
        )
    return normalized
