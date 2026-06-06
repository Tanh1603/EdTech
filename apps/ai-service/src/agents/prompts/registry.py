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
            "tutor.summary_partial": PromptTemplate(
                "v1",
                Template(
                    "SYSTEM:\n"
                    "You are TutorAgent. Summarize this ordered material segment in Vietnamese. "
                    "Keep the original sequence, key concepts, definitions, "
                    "examples, and warnings. "
                    "Do not add facts outside the segment.\n\n"
                    "SEGMENT:\n$index/$total\n\n"
                    "LEARNING_CONTEXT:\n$learning_context\n\n"
                    "ORDERED_CONTEXT:\n$ordered_context\n"
                ),
            ),
            "tutor.summary_reduce": PromptTemplate(
                "v1",
                Template(
                    "SYSTEM:\n"
                    "You are TutorAgent. Combine the partial summaries into one concise Vietnamese "
                    "lesson/material summary. Preserve the learning order, remove duplicates, and "
                    "mention that the material has no usable context if "
                    "the summaries are empty.\n\n"
                    "LEARNING_CONTEXT:\n$learning_context\n\n"
                    "STUDENT_QUESTION:\n$student_question\n\n"
                    "PARTIAL_SUMMARIES:\n$partial_summaries\n"
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
                    "You are AssessmentMaterialAgent. Grade the submitted exam answers "
                    "against the questions and their rubrics/answer keys.\n\n"
                    "SUBMISSION CONTEXT:\n"
                    "Submission: $submission\n\n"
                    "GUIDELINES:\n"
                    "- Match each question in 'submission.exam.questions' "
                    "with the student's answer in 'submission.answers' by questionId.\n"
                    "- For MCQ, True/False, and Short Answer, check exact correctness.\n"
                    "- For Essay questions, grade the student's response by comparing it "
                    "against the rubric/guidelines provided in the question's 'answerKey' "
                    "or 'explanation'.\n"
                    "- Award partial points for Essay questions if they hit some points "
                    "but missed others. The awarded score must be between 0.0 "
                    "and the question's 'points'.\n"
                    "- Provide constructive, personalized feedback in Vietnamese "
                    "for each question (explaining what they did well, what was missing "
                    "according to the rubric, and how to improve).\n"
                    "- Calculate the sum of all awarded question scores as the overall "
                    "'score', and the sum of all question points as the 'maxScore'.\n\n"
                    "OUTPUT FORMAT:\n"
                    "Return ONLY a raw JSON object with this exact structure (do NOT wrap "
                    "in markdown blocks, no backticks, no comments):\n"
                    "{\n"
                    "  \"score\": 8.5,\n"
                    "  \"maxScore\": 10.0,\n"
                    "  \"feedback\": {\n"
                    "    \"comment\": \"Overall constructive comment in Vietnamese...\",\n"
                    "    \"perQuestionFeedback\": {\n"
                    "      \"<question_uuid>\": {\n"
                    "        \"score\": 4.5,\n"
                    "        \"maxScore\": 5.0,\n"
                    "        \"comment\": \"Personalized Vietnamese "
                    "comment for this question...\"\n"
                    "      }\n"
                    "    }\n"
                    "  }\n"
                    "}"
                ),
            ),
            "exam_generation.prompt": PromptTemplate(
                "v1",
                Template(
                    "SYSTEM:\n"
                    "You are ExamGenerationAgent. Return a JSON array of questions "
                    "for an exam on the topic '$topic'.\n"
                    "Difficulty level: $difficulty\n"
                    "Number of questions to generate: $numberOfQuestions\n"
                    "Allowed question types: $questionTypes\n\n"
                    "Reference material content (RAG Context):\n"
                    "$materialContext\n\n"
                    "For each question, output a JSON object containing:\n"
                    "- type: must be one of ['mcq', 'true_false', 'short_answer', 'essay']\n"
                    "- prompt: the question prompt text in Vietnamese\n"
                    "- options: an array of strings for MCQ, or null/empty for other types\n"
                    "- answerKey: the correct answer. Index (integer 0-based) for MCQ, "
                    "boolean (true/false) for true_false, or string/null for others\n"
                    "- explanation: explanation in Vietnamese of why the answer is correct\n"
                    "- points: float value (default: 1.0)\n"
                    "- orderNo: 1-based order index of the question\n\n"
                    "Format the output strictly as a JSON list of question objects. "
                    "Do not include markdown code block backticks, just the raw JSON."
                ),
            ),
            "chat_title.prompt": PromptTemplate(
                "v1",
                Template(
                    "SYSTEM:\n"
                    "You are ChatTitleAgent. Create a short, descriptive title "
                    "(maximum 5 words, in Vietnamese) "
                    "for a chat session starting with this message:\n\n"
                    "\"$content\"\n\n"
                    "Guidelines:\n"
                    "- Return ONLY the plain text title, no quote marks, "
                    "no bullet points, no extra words.\n"
                    "- Choose a title that summarizes the core topic of the message."
                ),
            ),
            "material_summary.prompt": PromptTemplate(
                "v1",
                Template(
                    "SYSTEM:\n"
                    "You are MaterialSummaryAgent. Summarize and create a "
                    "structured study guide in Vietnamese for the following "
                    "material content (RAG Chunks):\n\n"
                    "\"$materialContext\"\n\n"
                    "Guidelines:\n"
                    "- Return markdown formatting.\n"
                    "- Output structure must include:\n"
                    "  1. Tóm tắt chính (Main summary - "
                    "concise overview of the material)\n"
                    "  2. Các khái niệm cốt lõi (Key concepts/definitions "
                    "with clear explanations)\n"
                    "  3. Câu hỏi ôn tập tự luyện (Self-review/study guide "
                    "questions with brief answers/hints)\n"
                    "- Ensure the tone is academic, helpful, and "
                    "written entirely in Vietnamese."
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
