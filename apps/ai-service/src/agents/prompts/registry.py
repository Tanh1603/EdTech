from __future__ import annotations

from dataclasses import dataclass
from string import Template
from typing import Any


@dataclass(frozen=True)
class PromptTemplate:
    version: str
    template: Template

    def render(self, values: dict[str, Any]) -> str:
        normalized = {key: _stringify(value) for key, value in values.items()}
        return self.template.safe_substitute(normalized)


class PromptRegistry:
    def __init__(self) -> None:
        self._templates: dict[str, PromptTemplate] = {
            "tutor.system": PromptTemplate(
                "v1",
                Template(
                    "SYSTEM:\n"
                    "You are TutorAgent for the EdTech platform. Answer in Vietnamese, "
                    "act like a tutor, stay inside the loaded learning context, and do "
                    "not invent citations or material facts.\n"
                ),
            ),
            "tutor.response_rules": PromptTemplate(
                "v1",
                Template(
                    "RESPONSE_RULES:\n"
                    "- If material context is missing or not ready, say clearly what is missing.\n"
                    "- For summary_material, summarize in the provided ordered material sequence.\n"
                    "- For qa_material and follow_up, use only relevant retrieved context.\n"
                    "- Cite only chunks returned by retrieval; never create fake citations.\n"
                ),
            ),
            "tutor.prompt": PromptTemplate(
                "v1",
                Template(
                    "$system\n"
                    "MODE:\n$intent\n\n"
                    "BUSINESS_POLICY:\n$business_policy\n\n"
                    "LEARNING_CONTEXT:\n$learning_context\n\n"
                    "MEMORY:\n$memory\n\n"
                    "CLEAN_HISTORY:\n$clean_history\n\n"
                    "RETRIEVED_CONTEXT:\n$retrieved_context\n\n"
                    "STUDENT_QUESTION:\n$question\n\n"
                    "$response_rules\n"
                    "WARNINGS:\n$warnings\n"
                ),
            ),
            "learning_path.prompt": PromptTemplate(
                "v1",
                Template(
                    "SYSTEM:\n"
                    "You are LearningPathAgent. Return a JSON object with title, "
                    "description, and items. Each item includes title, description, "
                    "orderNo, and estimatedMinutes.\n\n"
                    "USER_CONTEXT:\n"
                    "Student/user id: $user_id\n"
                    "Class id: $class_id\n"
                    "Course id: $course_id\n"
                    "Mastery context: $mastery\n"
                    "Analytics context: $analytics\n"
                    "Options: $options\n"
                ),
            ),
            "assessment_material.prompt": PromptTemplate(
                "v1",
                Template(
                    "SYSTEM:\n"
                    "You are AssessmentMaterialAgent. Grade submitted answers using "
                    "available rubric/context. Return JSON with score, maxScore, "
                    "feedback, and perQuestionFeedback.\n\n"
                    "SUBMISSION:\n"
                    "Submission id: $submission_id\n"
                    "Submission context: $submission\n"
                    "Options: $options\n"
                ),
            ),
        }

    def render(self, key: str, values: dict[str, Any] | None = None) -> str:
        template = self._templates[key]
        return template.render(values or {})

    def version(self, key: str) -> str:
        return self._templates[key].version


_REGISTRY = PromptRegistry()


def get_prompt_registry() -> PromptRegistry:
    return _REGISTRY


def _stringify(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    return repr(value)
