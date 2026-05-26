import re
from typing import Any

from agents.clients.be_core import BeCoreCallContext
from agents.orchestrator.state import RuntimeState
from agents.tools.registry import ToolContext


def tool_context(context: BeCoreCallContext) -> ToolContext:
    return ToolContext(
        request_id=context.request_id,
        correlation_id=context.correlation_id,
        user_id=context.user_id,
        roles=context.roles,
        permissions=context.permissions,
        job_id=context.job_id,
    )


def chat_state(
    action: str,
    session_id: str,
    message_id: str,
    context: BeCoreCallContext,
    use_rag: bool = True,
    top_k: int = 5,
    options: dict[str, Any] | None = None,
) -> RuntimeState:
    return {
        "action": action,
        "profile": "tutor",
        "session_id": session_id,
        "message_id": message_id,
        "user_id": context.user_id or "",
        "job_id": context.job_id or "",
        "use_rag": use_rag,
        "top_k": top_k,
        "options": options or {},
        "request_context": context,
        "tool_context": tool_context(context),
    }


def clean_stream_token(token: str) -> str:
    return re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", token)
