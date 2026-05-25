from agents.runtime.state import RuntimeState


def plan_node(state: RuntimeState) -> RuntimeState:
    action = state.get("action", "chat")
    profile = state.get("profile", "tutor")
    plan_by_action = {
        "chat": [
            "load delegated chat context",
            "retrieve material context when enabled",
            "generate tutor answer",
            "persist assistant message",
        ],
        "stream_chat": [
            "load delegated chat context",
            "retrieve material context when enabled",
            "stream tutor answer",
            "persist assistant message",
        ],
        "grade_submission": [
            "load submission and rubric context",
            "generate grading feedback",
            "write assessment result through BE Core",
        ],
        "generate_roadmap": [
            "load mastery and analytics context",
            "generate roadmap draft",
            "write roadmap and items through BE Core",
        ],
        "ingest_material": [
            "load material metadata",
            "parse and index material chunks",
            "write chunk/status updates through BE Core",
        ],
    }
    return {
        **state,
        "plan": plan_by_action.get(action, []),
        "metadata": {**state.get("metadata", {}), "agentProfile": profile},
    }
