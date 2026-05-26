from agents.orchestrator.state import RuntimeState, ToolCall


def select_tools_node(state: RuntimeState) -> RuntimeState:
    action = state.get("action", "chat")
    calls: list[ToolCall] = []

    if action in {"chat", "stream_chat"}:
        message_id = state.get("message_id")
        session_id = state.get("session_id")
        options = state.get("options", {})
        material_id = options.get("materialId") if isinstance(options, dict) else None
        if message_id:
            calls.append({"name": "chat.message", "payload": {"messageId": message_id}})
        if session_id:
            calls.append(
                {
                    "name": "chat.messages",
                    "payload": {"sessionId": session_id, "page": 1, "limit": 20},
                }
            )
        if material_id:
            calls.append({"name": "materials.get", "payload": {"materialId": str(material_id)}})
    elif action == "grade_submission":
        resource_id = state.get("resource_id")
        if resource_id:
            calls.append(
                {
                    "name": "assessments.submission",
                    "payload": {"submissionId": resource_id},
                }
            )
    elif action == "generate_roadmap":
        class_id = state.get("class_id")
        calls.append({"name": "learning.mastery", "payload": {"classId": class_id or ""}})
        if class_id:
            calls.append(
                {
                    "name": "chat.classroom_analytics",
                    "payload": {"classId": class_id},
                }
            )

    return {**state, "tool_calls": calls}
