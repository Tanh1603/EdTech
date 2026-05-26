from __future__ import annotations

import logging

from agents.orchestrator.nodes.common import material_id, normalize_text
from agents.orchestrator.state import RuntimeState
from agents.profiles.common import sanitize_text

logger = logging.getLogger(__name__)

SUMMARY_TERMS = (
    "tom tat",
    "tong ket",
    "noi dung bai",
    "noi dung material",
    "bai hoc nay noi gi",
)
FOLLOW_UP_TERMS = (
    "phan do",
    "phan nay",
    "y do",
    "do la",
    "giai thich them",
    "vi du",
)


def intent_router_node(state: RuntimeState) -> RuntimeState:
    if state.get("profile") != "tutor":
        return state
    question = sanitize_text(str(state.get("current_message") or ""))
    normalized = normalize_text(question)
    active_material_id = material_id(state)
    options = state.get("options", {})
    material_missing = isinstance(options, dict) and options.get("materialStatus") == "missing"
    if any(term in normalized for term in SUMMARY_TERMS):
        intent = "summary_material"
    elif any(term in normalized for term in FOLLOW_UP_TERMS):
        intent = "follow_up"
    elif material_missing and bool(state.get("use_rag", True)):
        intent = "qa_material"
    elif active_material_id and bool(state.get("use_rag", True)):
        intent = "qa_material"
    else:
        intent = "general_tutor"
    logger.info(
        "Tutor intent detected",
        extra={
            "component": "tutor.orchestrator",
            "step": "intent.detected",
            "sessionId": state.get("session_id", ""),
            "messageId": state.get("message_id", ""),
            "intent": intent,
            "materialId": active_material_id or "",
        },
    )
    return {**state, "intent": intent}
