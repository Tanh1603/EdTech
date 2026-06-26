from __future__ import annotations

import json
import logging
from typing import Any

from agents.orchestrator.state import RuntimeState
from agents.profiles.common import parse_json_object
from agents.prompts import get_prompt_registry
from agents.providers.llm_provider import LlmProvider
from agents.tools.registry import ToolRegistry

logger = logging.getLogger(__name__)



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
        initial_questions = parse_json_array(response.text)

        # Vòng lặp Solver-Verifier
        verified_questions: list[dict[str, Any]] = []
        all_generated_questions: list[dict[str, Any]] = []
        all_generated_questions.extend(initial_questions)

        current_batch_to_verify = list(initial_questions)
        total_input_tokens = response.input_tokens
        total_output_tokens = response.output_tokens

        for attempt in range(1, 4):
            logger.info(
                f"Exam Verification: Attempt {attempt}/3. "
                f"Verifying {len(current_batch_to_verify)} questions."
            )
            failed_this_attempt: list[dict[str, Any]] = []

            for q in current_batch_to_verify:
                q_type = q.get("type", "short_answer")
                if q_type == "essay":
                    verified_questions.append(q)
                    continue

                is_valid, issue, sol_in, sol_out = self._verify_single_question(q)
                total_input_tokens += sol_in
                total_output_tokens += sol_out

                if is_valid:
                    verified_questions.append(q)
                    logger.info(
                        f"Question verified successfully: "
                        f"{q.get('prompt', '')[:45]}..."
                    )
                else:
                    logger.warning(
                        f"Question failed verification: "
                        f"{q.get('prompt', '')[:45]}... Reason: {issue}"
                    )
                    failed_this_attempt.append({
                        "type": q_type,
                        "prompt": q.get("prompt"),
                        "options": q.get("options"),
                        "answerKey": q.get("answerKey"),
                        "critique": issue
                    })

            if len(verified_questions) >= number_of_questions:
                logger.info(
                    f"Exam Verification: Successfully verified enough "
                    f"questions ({len(verified_questions)}/{number_of_questions})"
                )
                break

            if attempt < 3 and failed_this_attempt:
                needed = number_of_questions - len(verified_questions)
                logger.info(f"Exam Verification: Need {needed} more questions. Regenerating...")

                failed_str = ""
                for index, f in enumerate(failed_this_attempt, start=1):
                    failed_str += (
                        f"Failed Question #{index}:\n"
                        f"- Type: {f.get('type')}\n"
                        f"- Prompt: {f.get('prompt')}\n"
                        f"- Options: {f.get('options')}\n"
                        f"- Expected AnswerKey: {f.get('answerKey')}\n"
                        f"- Critique: {f.get('critique')}\n\n"
                    )

                regen_prompt = self.prompts.render(
                    "exam_regeneration.prompt",
                    {
                        "topic": topic,
                        "difficulty": difficulty,
                        "questionTypes": ", ".join(question_types),
                        "materialContext": material_context,
                        "failedQuestions": failed_str,
                        "numberOfQuestionsToReplace": needed,
                    }
                )

                try:
                    regen_response = self.llm_provider.generate(regen_prompt)
                    total_input_tokens += regen_response.input_tokens
                    total_output_tokens += regen_response.output_tokens

                    replacements = parse_json_array(regen_response.text)
                    all_generated_questions.extend(replacements)
                    current_batch_to_verify = replacements
                except Exception as e:
                    logger.error(f"Failed during replacement questions generation: {e}")
                    current_batch_to_verify = []
            else:
                break

        # Bù bằng các câu hỏi fallback chưa verified nếu không đủ
        if len(verified_questions) < number_of_questions:
            logger.warning(
                f"Exam Verification: Only verified "
                f"{len(verified_questions)}/{number_of_questions} questions. "
                f"Backfilling with fallback questions."
            )
            verified_prompts = {q.get("prompt") for q in verified_questions}
            for q in all_generated_questions:
                if len(verified_questions) >= number_of_questions:
                    break
                if q.get("prompt") not in verified_prompts:
                    verified_questions.append(q)
                    verified_prompts.add(q.get("prompt"))

        # Giới hạn đúng số câu hỏi được yêu cầu
        final_questions = verified_questions[:number_of_questions]

        created_questions: list[dict[str, Any]] = []
        exam_id = state.get("resource_id", "")
        if context is not None and exam_id and final_questions:
            for index, q in enumerate(final_questions, start=1):
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
                "inputTokens": total_input_tokens,
                "outputTokens": total_output_tokens,
                "totalTokens": total_input_tokens + total_output_tokens,
                "model": response.model,
            },
        }

    def _verify_single_question(self, q: dict[str, Any]) -> tuple[bool, str | None, int, int]:
        q_type = q.get("type", "short_answer")
        if q_type == "essay":
            return True, None, 0, 0

        verify_prompt = self.prompts.render(
            "exam_verification.prompt",
            {
                "type": q_type,
                "prompt": q.get("prompt", ""),
                "options": q.get("options") or [],
            }
        )

        try:
            response = self.llm_provider.generate(verify_prompt)
            in_t = response.input_tokens
            out_t = response.output_tokens
            res_data = parse_json_object(response.text)
            is_valid = bool(res_data.get("isValid", False))
            resolved_answer = res_data.get("resolvedAnswer")
            issue = res_data.get("issueDescription")

            if not is_valid:
                return (
                    False,
                    issue or "Question marked invalid by verifier.",
                    in_t,
                    out_t,
                )

            expected_answer = q.get("answerKey")

            if q_type == "mcq":
                try:
                    if int(resolved_answer) != int(expected_answer):
                        return (
                            False,
                            f"Answer mismatch. Solver got index {resolved_answer}, "
                            f"Generator has {expected_answer}.",
                            in_t,
                            out_t,
                        )
                except (ValueError, TypeError):
                    return (
                        False,
                        f"Invalid MCQ answer format. Solver got {resolved_answer}, "
                        f"Generator has {expected_answer}.",
                        in_t,
                        out_t,
                    )

            elif q_type == "true_false":
                def to_bool(val: Any) -> bool | None:
                    if isinstance(val, bool):
                        return val
                    if isinstance(val, str):
                        if val.lower() == "true":
                            return True
                        if val.lower() == "false":
                            return False
                    return None

                sol_bool = to_bool(resolved_answer)
                gen_bool = to_bool(expected_answer)
                if sol_bool is None or gen_bool is None or sol_bool != gen_bool:
                    return (
                        False,
                        f"Answer mismatch. Solver got {resolved_answer}, "
                        f"Generator has {expected_answer}.",
                        in_t,
                        out_t,
                    )

            elif q_type == "short_answer":
                sol_str = str(resolved_answer).strip().lower()
                gen_str = str(expected_answer).strip().lower()
                if not sol_str or not gen_str or sol_str != gen_str:
                    return (
                        False,
                        f"Answer mismatch. Solver got '{resolved_answer}', "
                        f"Generator has '{expected_answer}'.",
                        in_t,
                        out_t,
                    )

            return True, None, in_t, out_t
        except Exception as e:
            return False, f"Exception during verification: {e}", 0, 0



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
