from __future__ import annotations

import logging

from agents.orchestrator.nodes.common import format_learning_context
from agents.orchestrator.state import RuntimeState
from agents.prompts import get_prompt_registry

logger = logging.getLogger(__name__)


def prompt_builder_node(state: RuntimeState) -> RuntimeState:
    if state.get("profile") != "tutor":
        return state
    registry = get_prompt_registry()
    intent = str(state.get("intent") or "general_tutor")
    question = str(state.get("standalone_question") or state.get("current_message") or "")
    memory_context = state.get("memory_context") or {}
    prompt = registry.render(
        "tutor.prompt",
        {
            "system": registry.render("tutor.system"),
            "intent": intent,
            "business_policy": state.get("business_policy") or "No policy context.",
            "learning_context": format_learning_context(state),
            "memory": memory_context or "No session memory.",
            "clean_history": state.get("clean_history") or "No recent clean history.",
            "retrieved_context": state.get("retrieved_context")
            or "No retrieved material context.",
            "question": question,
            "response_rules": registry.render("tutor.response_rules"),
            "warnings": "; ".join(state.get("response_warnings", [])) or "None",
        },
    )
    logger.info(
        "Tutor prompt built",
        extra={
            "component": "tutor.orchestrator",
            "step": "prompt.built",
            "intent": intent,
            "retrievalMode": state.get("retrieval_mode", "none"),
            "promptChars": len(prompt),
            "promptVersion": registry.version("tutor.prompt"),
        },
    )
    return {**state, "prompt_text": prompt, "prompt": question}
