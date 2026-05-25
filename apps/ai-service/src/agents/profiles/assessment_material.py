from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate

from agents.profiles.common import parse_json_object
from agents.providers.llm_provider import LlmProvider
from agents.runtime.state import RuntimeState
from agents.tools.registry import ToolRegistry


class AssessmentMaterialAgentProfile:
    def __init__(self, llm_provider: LlmProvider, registry: ToolRegistry) -> None:
        self.llm_provider = llm_provider
        self.registry = registry
        self.prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are AssessmentMaterialAgent. Grade submitted answers using "
                    "available rubric/context. Return JSON with score, maxScore, "
                    "feedback, and perQuestionFeedback.",
                ),
                (
                    "human",
                    "Submission id: {submission_id}\nSubmission context: {submission}\n"
                    "Options: {options}",
                ),
            ]
        )

    def run(self, state: RuntimeState) -> RuntimeState:
        context = state.get("tool_context")
        submission_id = state.get("resource_id", "")
        submission = state.get("tool_results", {}).get("assessments.submission", {})
        prompt_value = self.prompt.invoke(
            {
                "submission_id": submission_id,
                "submission": submission,
                "options": state.get("options", {}),
            }
        )
        response = self.llm_provider.generate(prompt_value.to_string())
        grading = parse_json_object(response.text) or {
            "feedback": response.text,
            "source": "ai-service",
        }
        result = {}
        if context is not None and submission_id:
            result = self.registry.call(
                "assessments.manual_grade",
                {"submissionId": submission_id, "body": grading},
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
