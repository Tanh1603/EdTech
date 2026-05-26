from __future__ import annotations

import logging

from agents.orchestrator.nodes.common import learning_context_from_state
from agents.orchestrator.state import RuntimeState
from agents.profiles.common import message_content, page_items_text

logger = logging.getLogger(__name__)


def load_context_node(state: RuntimeState) -> RuntimeState:
    if state.get("profile") != "tutor":
        return state
    tool_results = state.get("tool_results", {})
    current_message = message_content(tool_results.get("chat.message"))
    clean_history = page_items_text(tool_results.get("chat.messages"))
    learning_context = learning_context_from_state(state)
    logger.info(
        "Tutor context loaded",
        extra={
            "component": "tutor.orchestrator",
            "step": "context.load",
            "sessionId": state.get("session_id", ""),
            "messageId": state.get("message_id", ""),
            "materialId": learning_context.get("materialId", ""),
            "materialStatus": learning_context.get("materialStatus", ""),
            "historyChars": len(clean_history),
        },
    )
    return {
        **state,
        "current_message": current_message,
        "clean_history": clean_history,
        "learning_context": learning_context,
    }
