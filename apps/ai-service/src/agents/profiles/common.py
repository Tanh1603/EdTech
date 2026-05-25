from __future__ import annotations

import json
from typing import Any


def message_content(value: dict[str, Any] | None) -> str:
    if not value:
        return ""
    for key in ("content", "text", "message"):
        if isinstance(value.get(key), str):
            return str(value[key])
    body = value.get("body")
    if isinstance(body, dict):
        for key in ("content", "text", "message"):
            if isinstance(body.get(key), str):
                return str(body[key])
    return ""


def page_items_text(value: dict[str, Any] | None) -> str:
    if not value:
        return ""
    items = value.get("items")
    if not isinstance(items, list):
        return ""
    lines: list[str] = []
    for item in items:
        if isinstance(item, dict):
            content = message_content(item)
            role = item.get("role") or item.get("authorRole") or "message"
            if content:
                lines.append(f"{role}: {content}")
    return "\n".join(lines)


def parse_json_object(text: str) -> dict[str, Any]:
    stripped = text.strip()
    if stripped.startswith("```"):
        stripped = stripped.strip("`")
        stripped = stripped.removeprefix("json").strip()
    try:
        value = json.loads(stripped)
        return value if isinstance(value, dict) else {}
    except json.JSONDecodeError:
        start = stripped.find("{")
        end = stripped.rfind("}")
        if start >= 0 and end > start:
            try:
                value = json.loads(stripped[start : end + 1])
                return value if isinstance(value, dict) else {}
            except json.JSONDecodeError:
                return {}
    return {}
