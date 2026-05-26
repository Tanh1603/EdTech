from __future__ import annotations

import logging

from agents.orchestrator.nodes.common import history_tail
from agents.orchestrator.state import RuntimeState
from agents.profiles.common import sanitize_text

logger = logging.getLogger(__name__)


def query_rewriter_node(state: RuntimeState) -> RuntimeState:
    if state.get("profile") != "tutor":
        return state
    question = sanitize_text(str(state.get("current_message") or ""))
    standalone = question
    if state.get("intent") == "follow_up":
        tail = history_tail(str(state.get("clean_history") or ""))
        if tail:
            standalone = (
                "Answer this follow-up as a standalone question. "
                f"Question: {question}. Recent context: {tail}"
            )
    logger.info(
        "Tutor query rewritten",
        extra={
            "component": "tutor.orchestrator",
            "step": "query.rewritten",
            "sessionId": state.get("session_id", ""),
            "intent": state.get("intent", ""),
            "rewritten": standalone != question,
        },
    )
    return {**state, "standalone_question": standalone}
