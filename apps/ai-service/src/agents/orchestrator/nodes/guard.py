from __future__ import annotations

import logging

from agents.orchestrator.state import RuntimeState
from agents.profiles.common import sanitize_text

logger = logging.getLogger(__name__)


def response_guard_node(state: RuntimeState) -> RuntimeState:
    if state.get("profile") != "tutor":
        return state
    content = sanitize_text(str(state.get("content") or ""))
    warnings = list(state.get("response_warnings", []))
    if not content:
        warnings.append("assistant_response_empty_after_sanitize")
    logger.info(
        "Tutor response sanitized",
        extra={
            "component": "tutor.orchestrator",
            "step": "response.sanitized",
            "sessionId": state.get("session_id", ""),
            "contentChars": len(content),
            "warningCount": len(warnings),
        },
    )
    return {**state, "content": content, "response_warnings": warnings}
