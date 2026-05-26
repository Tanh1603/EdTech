from __future__ import annotations

from typing import Any

from agents.profiles.common import sanitize_text
from agents.prompts import get_prompt_registry
from agents.providers.llm_provider import LlmProvider


def summary_batches(results: list[Any], max_chars: int = 8_000) -> list[str]:
    batches: list[str] = []
    current: list[str] = []
    current_chars = 0

    for result in results:
        citation = getattr(result, "citation", {}) or {}
        order_no = citation.get("orderNo") or citation.get("order_no") or ""
        title = citation.get("title") or ""
        content = sanitize_text(str(getattr(result, "content", "") or ""))
        line = (
            f"chunkId={getattr(result, 'chunk_id', '')} "
            f"orderNo={order_no} title={title}\n{content}"
        )
        if current and current_chars + len(line) > max_chars:
            batches.append("\n\n".join(current))
            current = []
            current_chars = 0
        current.append(line)
        current_chars += len(line)

    if current:
        batches.append("\n\n".join(current))
    return batches


def generate_map_reduce_summary(
    llm_provider: LlmProvider,
    state: dict[str, Any],
) -> tuple[str, dict[str, Any]]:
    batches = [str(batch) for batch in state.get("summary_batches", []) if str(batch).strip()]
    if not batches:
        return "", {"inputTokens": 0, "outputTokens": 0, "totalTokens": 0, "model": ""}

    registry = get_prompt_registry()
    partials: list[str] = []
    input_tokens = 0
    output_tokens = 0
    model = ""

    for index, batch in enumerate(batches):
        response = llm_provider.generate(
            registry.render(
                "tutor.summary_partial",
                {
                    "index": index + 1,
                    "total": len(batches),
                    "learning_context": state.get("learning_context", {}),
                    "ordered_context": batch,
                },
            )
        )
        partials.append(sanitize_text(response.text))
        input_tokens += response.input_tokens
        output_tokens += response.output_tokens
        model = response.model

    final_response = llm_provider.generate(
        registry.render(
            "tutor.summary_reduce",
            {
                "learning_context": state.get("learning_context", {}),
                "partial_summaries": "\n\n".join(
                    f"[{index + 1}] {summary}" for index, summary in enumerate(partials)
                ),
                "student_question": state.get("current_message") or "",
            },
        )
    )
    input_tokens += final_response.input_tokens
    output_tokens += final_response.output_tokens
    model = final_response.model or model
    return sanitize_text(final_response.text), {
        "inputTokens": input_tokens,
        "outputTokens": output_tokens,
        "totalTokens": input_tokens + output_tokens,
        "model": model,
    }
