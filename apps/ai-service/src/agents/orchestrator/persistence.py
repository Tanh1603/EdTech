import logging

from agents.orchestrator.state import RuntimeState
from agents.tools.registry import ToolRegistry

logger = logging.getLogger(__name__)


class PersistenceNode:
    def __init__(self, registry: ToolRegistry) -> None:
        self.registry = registry

    def __call__(self, state: RuntimeState) -> RuntimeState:
        if state.get("assistant_message_id") or not state.get("content"):
            return state
        if state.get("action") not in {"chat", "stream_chat"}:
            return state
        context = state.get("tool_context")
        session_id = state.get("session_id")
        if context is None or not session_id:
            return state

        message = self.registry.call(
            "chat.append_assistant",
            {"sessionId": session_id, "content": state["content"]},
            context,
        )
        logger.info(
            "Assistant message persisted",
            extra={
                "component": "tutor.orchestrator",
                "step": "persistence.saved",
                "sessionId": session_id,
                "messageId": str(message.get("id") or ""),
            },
        )
        return {**state, "assistant_message_id": str(message.get("id") or "")}
