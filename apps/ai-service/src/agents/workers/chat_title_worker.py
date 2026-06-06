from __future__ import annotations

from agents.orchestrator.graph import AgentRuntime
from agents.prompts import get_prompt_registry
from agents.tools.registry import ToolContext
from agents.workers.worker import JobMessage


class ChatTitleWorker:
    def __init__(self, runtime: AgentRuntime) -> None:
        self.runtime = runtime
        self.llm_provider = runtime.dependencies.llm_provider
        self.registry = runtime.dependencies.registry
        self.prompts = get_prompt_registry()

    def handle(self, message: JobMessage) -> dict[str, object]:
        session_id = str(message.payload.get("sessionId") or message.resource_id)
        content = str(message.payload.get("content") or "")
        context = _context_from_message(message)

        prompt = self.prompts.render(
            "chat_title.prompt",
            {"content": content},
        )
        response = self.llm_provider.generate(prompt)
        title = response.text.strip().strip('"').strip("'")

        # Save session title back to backend
        self.registry.call(
            "chat.update_session",
            {
                "sessionId": session_id,
                "body": {"title": title},
            },
            context,
        )

        return {
            "sessionId": session_id,
            "title": title,
            "usage": {
                "inputTokens": response.input_tokens,
                "outputTokens": response.output_tokens,
                "totalTokens": response.input_tokens + response.output_tokens,
                "model": response.model,
            },
        }


def _context_from_message(message: JobMessage) -> ToolContext:
    user_id = (
        message.payload.get("requestedBy")
        or message.payload.get("createdBy")
        or message.payload.get("userId")
        or message.payload.get("user_id")
    )
    return ToolContext(
        request_id=message.request_id,
        correlation_id=message.correlation_id,
        user_id=str(user_id) if user_id else None,
        roles=("admin",),
        job_id=message.job_id,
    )
