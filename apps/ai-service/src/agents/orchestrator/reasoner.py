from agents.orchestrator.state import RuntimeState


def reason_node(state: RuntimeState) -> RuntimeState:
    reasoning = {
        "action": state.get("action"),
        "profile": state.get("profile"),
        "requiresUserContext": state.get("action") in {"chat", "stream_chat"},
        "useRag": bool(state.get("use_rag", True)),
    }
    return {**state, "reasoning": reasoning}
