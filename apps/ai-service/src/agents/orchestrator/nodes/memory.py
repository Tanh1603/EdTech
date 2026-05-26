from __future__ import annotations

import logging
from dataclasses import dataclass

from agents.memory.session_memory import MemoryKeyBuilder, MemoryStore
from agents.orchestrator.state import RuntimeState
from agents.profiles.common import sanitize_text

logger = logging.getLogger(__name__)


@dataclass
class MemoryNode:
    memory: MemoryStore | None = None
    key_builder: MemoryKeyBuilder | None = None

    def __call__(self, state: RuntimeState) -> RuntimeState:
        if state.get("profile") != "tutor":
            return state
        metadata = dict(state.get("metadata", {}))
        session_id = state.get("session_id")
        token_budget = 0
        scratchpad = ""
        interactive_summary = ""
        if self.memory and session_id:
            key_builder = self.key_builder or MemoryKeyBuilder()
            token_budget = int(
                self.memory.get(key_builder.session_token_budget(str(session_id))) or 0
            )
            scratchpad = sanitize_text(
                str(self.memory.get(key_builder.session_scratchpad(str(session_id))) or ""),
                max_chars=1200,
            )
            interactive_summary = sanitize_text(
                str(self.memory.get(key_builder.session_interactive(str(session_id))) or ""),
                max_chars=1200,
            )
        metadata["sessionTokenBudget"] = token_budget
        logger.info(
            "Tutor memory loaded",
            extra={
                "component": "tutor.orchestrator",
                "step": "memory.load",
                "sessionId": session_id or "",
                "tokenBudget": token_budget,
                "hasScratchpad": bool(scratchpad),
                "hasInteractiveSummary": bool(interactive_summary),
            },
        )
        return {
            **state,
            "metadata": metadata,
            "memory_context": {
                "scratchpad": scratchpad,
                "interactiveSummary": interactive_summary,
                "tokenBudget": token_budget,
            },
        }
