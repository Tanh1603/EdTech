from __future__ import annotations

import json
import logging

from agents.orchestrator.state import RuntimeState
from agents.profiles.common import parse_json_object
from agents.prompts import get_prompt_registry
from agents.providers.llm_provider import LlmProvider
from agents.tools.registry import ToolRegistry

logger = logging.getLogger(__name__)


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

        total_input_tokens = response.input_tokens
        total_output_tokens = response.output_tokens

        # Vòng lặp Reflection: Grader -> Critic -> Revision (Tối đa 3 attempt)
        for attempt in range(1, 4):
            logger.info(
                f"Grading Reflection: Attempt {attempt}/3. "
                f"Reviewing grading draft for submission {submission_id}."
            )

            critique_prompt = self.prompts.render(
                "assessment_material_critique.prompt",
                {
                    "submission": submission,
                    "draftGrading": json.dumps(grading),
                }
            )

            try:
                critique_response = self.llm_provider.generate(critique_prompt)
                total_input_tokens += critique_response.input_tokens
                total_output_tokens += critique_response.output_tokens

                critique_data = parse_json_object(critique_response.text)
                is_valid = bool(critique_data.get("isValid", False))
                critique_desc = critique_data.get("critiqueDescription")

                if is_valid:
                    logger.info(
                        f"Grading draft verified successfully "
                        f"for submission {submission_id}."
                    )
                    break

                logger.warning(
                    f"Grading draft failed verification for "
                    f"submission {submission_id}. Reason: {critique_desc}"
                )

                if attempt < 3:
                    logger.info(
                        f"Grading Reflection: Requesting revision "
                        f"for attempt {attempt + 1}/3..."
                    )
                    revision_prompt = self.prompts.render(
                        "assessment_material_revision.prompt",
                        {
                            "submission": submission,
                            "failedGrading": json.dumps(grading),
                            "critique": critique_desc,
                        }
                    )

                    revision_response = self.llm_provider.generate(revision_prompt)
                    total_input_tokens += revision_response.input_tokens
                    total_output_tokens += revision_response.output_tokens

                    grading = parse_json_object(revision_response.text) or {}
                else:
                    logger.info(
                        "Grading Reflection: Reached maximum attempts (3/3). "
                        "Proceeding with the best effort grading."
                    )
            except Exception as e:
                logger.error(f"Failed during grading reflection/verification loop: {e}")
                break

        # Prepare payload matching ManualGradeDto structure
        score_val = grading.get("score")
        score = float(score_val if score_val is not None else 0.0)
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
                "inputTokens": total_input_tokens,
                "outputTokens": total_output_tokens,
                "totalTokens": total_input_tokens + total_output_tokens,
                "model": response.model,
            },
        }
