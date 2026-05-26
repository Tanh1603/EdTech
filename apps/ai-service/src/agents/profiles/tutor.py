from __future__ import annotations

from agents.memory.session_memory import MemoryKeyBuilder, MemoryStore
from agents.orchestrator.state import RuntimeState
from agents.profiles.common import sanitize_text
from agents.providers.llm_provider import LlmProvider


class TutorAgentProfile:
    def __init__(
        self,
        llm_provider: LlmProvider,
        memory: MemoryStore | None = None,
        key_builder: MemoryKeyBuilder | None = None,
    ) -> None:
        self.llm_provider = llm_provider
        self.memory = memory
        self.key_builder = key_builder or MemoryKeyBuilder()

    def run(self, state: RuntimeState) -> RuntimeState:
        prompt_text = str(state.get("prompt_text") or state.get("prompt") or "")
        citations = state.get("citations", [])
        retrieval_results = state.get("retrieval_results", [])
        response = self.llm_provider.generate(prompt_text)
        self._remember_usage(state, response.input_tokens + response.output_tokens)
        return {
            **state,
            "prompt": prompt_text,
            "retrieval_results": retrieval_results,
            "citations": citations,
            "content": sanitize_text(response.text),
            "usage": {
                "inputTokens": response.input_tokens,
                "outputTokens": response.output_tokens,
                "totalTokens": response.input_tokens + response.output_tokens,
                "model": response.model,
            },
        }

    def _remember_usage(self, state: RuntimeState, tokens: int) -> None:
        if not self.memory or not state.get("session_id"):
            return
        key = self.key_builder.session_token_budget(str(state["session_id"]))
        self.memory.increment(key, tokens, ttl_seconds=3600)
