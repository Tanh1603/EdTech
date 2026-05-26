from __future__ import annotations

import json
import re
from typing import Any

_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
_WHITESPACE = re.compile(r"\s+")


def message_content(value: dict[str, Any] | None) -> str:
    if not value:
        return ""
    for key in ("content", "text", "message"):
        if isinstance(value.get(key), str):
            return sanitize_text(str(value[key]))
    body = value.get("body")
    if isinstance(body, dict):
        for key in ("content", "text", "message"):
            if isinstance(body.get(key), str):
                return sanitize_text(str(body[key]))
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
            if content and _is_usable_history_content(content):
                lines.append(f"{role}: {content}")
    return "\n".join(lines)


def sanitize_text(value: str, max_chars: int | None = None) -> str:
    cleaned = _CONTROL_CHARS.sub("", value)
    cleaned = _WHITESPACE.sub(" ", cleaned).strip()
    if max_chars and len(cleaned) > max_chars:
        return cleaned[:max_chars].rstrip()
    return cleaned


def control_char_ratio(value: str) -> float:
    if not value:
        return 0.0
    return len(_CONTROL_CHARS.findall(value)) / max(1, len(value))


def _is_usable_history_content(value: str) -> bool:
    if not value:
        return False
    if control_char_ratio(value) > 0.05:
        return False
    return len(value.strip()) >= 2


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
