from __future__ import annotations

import logging
from dataclasses import dataclass

from agents.orchestrator.nodes.common import material_id
from agents.orchestrator.state import RuntimeState

logger = logging.getLogger(__name__)


@dataclass
class BusinessPolicyNode:
    def __call__(self, state: RuntimeState) -> RuntimeState:
        if state.get("profile") != "tutor":
            return state
        warnings = list(state.get("response_warnings", []))
        active_material_id = material_id(state)
        material_status = str(state.get("learning_context", {}).get("materialStatus") or "")
        intent = str(state.get("intent") or "general_tutor")
        if intent in {"summary_material", "qa_material", "follow_up"} and not active_material_id:
            warnings.append("material_context_missing")
        if active_material_id and material_status and material_status != "ready":
            warnings.append(f"material_not_ready:{material_status}")
        policy = (
            "Use BE Core metadata as source of truth. Use material context only when "
            "the material is ready. Do not answer with unsupported citations. "
            "For summaries, preserve source order. For QA, use semantic retrieval."
        )
        logger.info(
            "Tutor business policy evaluated",
            extra={
                "component": "tutor.orchestrator",
                "step": "policy.checked",
                "intent": intent,
                "materialId": active_material_id or "",
                "materialStatus": material_status,
                "warningCount": len(warnings),
            },
        )
        return {**state, "business_policy": policy, "response_warnings": warnings}
