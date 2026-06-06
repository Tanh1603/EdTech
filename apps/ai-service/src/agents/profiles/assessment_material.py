from __future__ import annotations

from agents.orchestrator.state import RuntimeState
from agents.profiles.common import parse_json_object
from agents.prompts import get_prompt_registry
from agents.providers.llm_provider import LlmProvider
from agents.tools.registry import ToolRegistry


class AssessmentMaterialAgentProfile:
    def __init__(self, llm_provider: LlmProvider, registry: ToolRegistry) -> None:
        self.llm_provider = llm_provider
        self.registry = registry
        self.prompts = get_prompt_registry()

    def run(self, state: RuntimeState) -> RuntimeState:
        context = state.get("tool_context")
        submission_id = state.get("resource_id", "")
        submission = state.get("tool_results", {}).get("assessments.submission", {})
        prompt = self.prompts.render(
            "assessment_material.prompt",
            {
                "submission_id": submission_id,
                "submission": submission,
                "options": state.get("options", {}),
            },
        )
        response = self.llm_provider.generate(prompt)
        grading = parse_json_object(response.text) or {}
        
        # Prepare payload matching ManualGradeDto structure
        score = float(grading.get("score") if grading.get("score") is not None else 0.0)
        feedback = grading.get("feedback")
        if not isinstance(feedback, dict):
            feedback = {
                "comment": str(feedback or response.text),
                "perQuestionFeedback": {}
            }
        
        grading_payload = {
            "score": score,
            "feedback": feedback,
            "gradedByAi": True,
        }

        result = {}
        if context is not None and submission_id:
            result = self.registry.call(
                "assessments.manual_grade",
                {
                    "submissionId": submission_id,
                    "body": grading_payload,
                },
                context,
            )

        return {
            **state,
            "content": response.text,
            "metadata": {**state.get("metadata", {}), "gradingResult": result},
            "usage": {
                "inputTokens": response.input_tokens,
                "outputTokens": response.output_tokens,
                "totalTokens": response.input_tokens + response.output_tokens,
                "model": response.model,
            },
        }
