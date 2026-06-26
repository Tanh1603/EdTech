from __future__ import annotations

import json
from typing import Any

from agents.orchestrator.state import RuntimeState
from agents.prompts import get_prompt_registry
from agents.providers.llm_provider import LlmProvider
from agents.tools.registry import ToolRegistry


class ExamGenerationAgentProfile:
    def __init__(self, llm_provider: LlmProvider, registry: ToolRegistry) -> None:
        self.llm_provider = llm_provider
        self.registry = registry
        self.prompts = get_prompt_registry()

    def run(self, state: RuntimeState) -> RuntimeState:
        context = state.get("tool_context")
        options = state.get("options", {})
        topic = options.get("topic", "General Assessment")
        difficulty = options.get("difficulty", "medium")
        number_of_questions = int(options.get("numberOfQuestions") or 10)
        
        # Limit maximum 20 questions as proposed/approved
        if number_of_questions > 20:
            number_of_questions = 20
        elif number_of_questions < 1:
            number_of_questions = 1

        question_types = options.get(
            "questionTypes", ["mcq", "true_false", "short_answer", "essay"]
        )
        material_id = options.get("materialId")

        material_context = ""
        if material_id and context is not None:
            try:
                chunks_res = self.registry.call(
                    "materials.chunks",
                    {"materialId": material_id, "limit": 30},
                    context,
                )
                chunks = chunks_res.get("items", [])
                material_context = "\n---\n".join([str(c.get("content") or "") for c in chunks])
            except Exception as e:
                material_context = f"Error fetching material context: {e}"
        else:
            material_context = "No specific material reference provided."

        prompt = self.prompts.render(
            "exam_generation.prompt",
            {
                "topic": topic,
                "difficulty": difficulty,
                "numberOfQuestions": number_of_questions,
                "questionTypes": ", ".join(question_types),
                "materialContext": material_context,
            },
        )

        response = self.llm_provider.generate(prompt)
        questions = parse_json_array(response.text)
        created_questions: list[dict[str, Any]] = []

        exam_id = state.get("resource_id", "")
        if context is not None and exam_id and questions:
            for index, q in enumerate(questions, start=1):
                q_body = {
                    "type": str(q.get("type") or "short_answer"),
                    "prompt": str(q.get("prompt") or ""),
                    "options": q.get("options"),
                    "answerKey": q.get("answerKey"),
                    "explanation": q.get("explanation"),
                    "points": float(q.get("points") or 1.0),
                    "orderNo": int(q.get("orderNo") or index),
                }
                created_q = self.registry.call(
                    "questions.create",
                    {"examId": exam_id, "body": q_body},
                    context,
                )
                created_questions.append(created_q)

        return {
            **state,
            "content": response.text,
            "metadata": {
                **state.get("metadata", {}),
                "questions": created_questions,
            },
            "usage": {
                "inputTokens": response.input_tokens,
                "outputTokens": response.output_tokens,
                "totalTokens": response.input_tokens + response.output_tokens,
                "model": response.model,
            },
        }


def parse_json_array(text: str) -> list[Any]:
    stripped = text.strip()
    if stripped.startswith("```"):
        stripped = stripped.strip("`")
        stripped = stripped.removeprefix("json").strip()
    try:
        value = json.loads(stripped)
        if isinstance(value, list):
            return value
        if isinstance(value, dict):
            for val in value.values():
                if isinstance(val, list):
                    return val
            return []
    except json.JSONDecodeError:
        start = stripped.find("[")
        end = stripped.rfind("]")
        if start >= 0 and end > start:
            try:
                value = json.loads(stripped[start : end + 1])
                if isinstance(value, list):
                    return value
                if isinstance(value, dict):
                    for val in value.values():
                        if isinstance(val, list):
                            return val
            except json.JSONDecodeError:
                return []
    return []
