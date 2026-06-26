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
        class_id = state.get("class_id", "")
        course_materials_str = "No classroom context provided."
        
        if class_id and context is not None:
            try:
                lessons = self.registry.call(
                    "academic.classroom_lessons",
                    {"classId": class_id, "publishedOnly": True},
                    context,
                )
            except Exception:
                lessons = []
            
            materials_list = []
            for lesson in lessons:
                lesson_id = lesson.get("lessonId")
                if not lesson_id:
                    continue
                try:
                    mats_page = self.registry.call(
                        "learning.materials",
                        {"lessonId": lesson_id, "status": "ready", "page": 1, "limit": 100},
                        context,
                    )
                    mats = mats_page.get("items") or []
                except Exception:
                    mats = []
                
                lesson_info = {
                    "lessonId": lesson_id,
                    "title": lesson.get("title") or "",
                    "description": lesson.get("description") or "",
                    "materials": []
                }
                for m in mats:
                    lesson_info["materials"].append({
                        "title": m.get("title") or "",
                        "summary": m.get("summary") or ""
                    })
                materials_list.append(lesson_info)
            
            if materials_list:
                lines = []
                for idx, lesson in enumerate(materials_list, start=1):
                    lines.append(f"{idx}. Lesson: {lesson['title']} (ID: {lesson['lessonId']})")
                    if lesson['description']:
                        lines.append(f"   Description: {lesson['description']}")
                    if lesson['materials']:
                        lines.append("   Materials:")
                        for m in lesson['materials']:
                            lines.append(f"     - Title: {m['title']}")
                            if m['summary']:
                                lines.append(f"       Summary: {m['summary']}")
                    else:
                        lines.append("   No materials available.")
                course_materials_str = "\n".join(lines)
            else:
                course_materials_str = "No classroom lessons or materials available."

        prompt = self.prompts.render(
            "learning_path.prompt",
            {
                "user_id": state.get("user_id", ""),
                "class_id": class_id,
                "course_id": state.get("course_id", ""),
                "mastery": tool_results.get("learning.mastery", {}),
                "analytics": tool_results.get("chat.classroom_analytics", {}),
                "options": state.get("options", {}),
                "course_materials": course_materials_str,
            },
        )
        response = self.llm_provider.generate(prompt)
        draft = parse_json_object(response.text)
        
        # Critique-Revision Loop (Reflection Loop)
        max_attempts = 3
        attempt = 1
        input_tokens_total = response.input_tokens
        output_tokens_total = response.output_tokens
        model_name = response.model
        
        while attempt <= max_attempts:
            critique_prompt = self.prompts.render(
                "learning_path_critique.prompt",
                {
                    "course_materials": course_materials_str,
                    "draftRoadmap": response.text,
                }
            )
            critique_response = self.llm_provider.generate(critique_prompt)
            input_tokens_total += critique_response.input_tokens
            output_tokens_total += critique_response.output_tokens
            
            critique_result = parse_json_object(critique_response.text)
            is_valid = bool(critique_result.get("isValid"))
            
            if is_valid:
                break
                
            # If not valid, revise
            revision_prompt = self.prompts.render(
                "learning_path_revision.prompt",
                {
                    "course_materials": course_materials_str,
                    "failedRoadmap": response.text,
                    "critique": critique_response.text,
                }
            )
            revision_response = self.llm_provider.generate(revision_prompt)
            input_tokens_total += revision_response.input_tokens
            output_tokens_total += revision_response.output_tokens
            
            response = revision_response
            draft = parse_json_object(response.text)
            attempt += 1

        roadmap_id = state.get("options", {}).get("roadmapId") or state.get("resource_id", "")
        roadmap: dict[str, Any] = {}
        created_items: list[dict[str, Any]] = []

        if context is not None:
            if roadmap_id:
                target_goal = (
                    state.get("options", {}).get("targetGoal")
                    or str(draft.get("targetGoal") or "")
                )
                update_body = {
                    "title": str(draft.get("title") or "AI Learning Roadmap"),
                    "targetGoal": target_goal,
                    "status": "active",
                }
                roadmap = self.registry.call(
                    "roadmaps.update",
                    {"roadmapId": roadmap_id, "body": update_body},
                    context,
                )
            else:
                roadmap_body = self._roadmap_body(state, draft, response.text)
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
                "inputTokens": input_tokens_total,
                "outputTokens": output_tokens_total,
                "totalTokens": input_tokens_total + output_tokens_total,
                "model": model_name,
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
        normalized_item = {
            "title": str(item.get("title") or f"Step {index}"),
            "description": str(item.get("description") or ""),
            "orderNo": int(item.get("orderNo") or index),
        }
        if "topic" in item:
            normalized_item["topic"] = str(item.get("topic") or "")
        normalized.append(normalized_item)
    return normalized
