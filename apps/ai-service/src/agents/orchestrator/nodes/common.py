from __future__ import annotations

import unicodedata
from typing import Any

from agents.orchestrator.state import RuntimeState
from agents.profiles.common import sanitize_text


def material_id(state: RuntimeState) -> str | None:
    context = state.get("learning_context", {})
    if isinstance(context, dict) and context.get("materialId"):
        return str(context["materialId"])
    options = state.get("options", {})
    value = options.get("materialId") if isinstance(options, dict) else None
    return str(value) if value else None


def format_learning_context(state: RuntimeState) -> str:
    context = state.get("learning_context", {})
    if not isinstance(context, dict) or not context:
        return "No learning context loaded."
    return "\n".join(f"{key}: {value}" for key, value in context.items() if value)


def history_tail(history: str, max_chars: int = 700) -> str:
    lines = [line for line in history.splitlines() if line.strip()]
    return sanitize_text("\n".join(lines[-6:]), max_chars=max_chars)


def normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value.lower())
    without_marks = "".join(char for char in normalized if not unicodedata.combining(char))
    return sanitize_text(without_marks)


def learning_context_from_state(state: RuntimeState) -> dict[str, Any]:
    options = state.get("options", {})
    material = state.get("tool_results", {}).get("materials.get")
    option_material_id = options.get("materialId") if isinstance(options, dict) else None
    option_material_title = options.get("materialTitle") if isinstance(options, dict) else None
    option_lesson_id = options.get("lessonId") if isinstance(options, dict) else None
    option_auto_resolved = (
        options.get("materialAutoResolved") if isinstance(options, dict) else None
    )
    if isinstance(material, dict):
        return {
            "materialId": str(material.get("id") or option_material_id or ""),
            "materialTitle": str(material.get("title") or ""),
            "materialStatus": str(material.get("status") or ""),
            "lessonId": str(material.get("lessonId") or ""),
            "mimeType": str(material.get("mimeType") or ""),
            "chunksCount": material.get("chunksCount") or 0,
            "materialAutoResolved": option_auto_resolved,
        }
    return {
        "materialId": str(option_material_id or ""),
        "materialTitle": str(option_material_title or ""),
        "lessonId": str(option_lesson_id or ""),
        "materialAutoResolved": option_auto_resolved,
        "materialStatus": (
            str(options.get("materialStatus") or "") if isinstance(options, dict) else ""
        ),
    }
