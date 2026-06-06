from __future__ import annotations

from agents.orchestrator.graph import AgentRuntime
from agents.prompts import get_prompt_registry
from agents.tools.registry import ToolContext
from agents.workers.worker import JobMessage


class MaterialSummaryWorker:
    def __init__(self, runtime: AgentRuntime) -> None:
        self.runtime = runtime
        self.llm_provider = runtime.dependencies.llm_provider
        self.registry = runtime.dependencies.registry
        self.prompts = get_prompt_registry()

    def handle(self, message: JobMessage) -> dict[str, object]:
        material_id = str(message.payload.get("materialId") or message.resource_id)
        context = _context_from_message(message)

        # Retrieve material chunks
        chunks_data = self.registry.call(
            "materials.chunks",
            {"materialId": material_id, "page": 1, "limit": 100},
            context,
        )
        chunks = chunks_data.get("items") or []

        # Sort chunks by orderNo
        sorted_chunks = sorted(
            chunks,
            key=lambda c: int(c.get("orderNo") or c.get("order_no") or 0),
        )
        material_context = "\n\n".join([str(c.get("content") or "") for c in sorted_chunks])

        if not material_context:
            summary = "Tài liệu không có nội dung văn bản để tóm tắt."
            input_tokens = 0
            output_tokens = 0
            model = "none"
        else:
            prompt = self.prompts.render(
                "material_summary.prompt",
                {"materialContext": material_context},
            )
            response = self.llm_provider.generate(prompt)
            summary = response.text
            input_tokens = response.input_tokens
            output_tokens = response.output_tokens
            model = response.model

        # Save summary back to backend
        self.registry.call(
            "materials.update_summary",
            {
                "materialId": material_id,
                "summary": summary,
            },
            context,
        )

        return {
            "materialId": material_id,
            "summary": summary,
            "usage": {
                "inputTokens": input_tokens,
                "outputTokens": output_tokens,
                "totalTokens": input_tokens + output_tokens,
                "model": model,
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
