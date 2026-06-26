import unittest
from unittest.mock import Mock, patch
import json
import sys
import os

# Add src/ folder to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))

from agents.orchestrator.graph import AgentRuntime
from agents.profiles.exam_generator import ExamGenerationAgentProfile
from agents.orchestrator.state import RuntimeState
from agents.providers.llm_provider import LlmResponse


class TestExamGeneratorLoop(unittest.TestCase):
    def setUp(self):
        self.mock_llm = Mock()
        self.mock_registry = Mock()
        self.profile = ExamGenerationAgentProfile(self.mock_llm, self.mock_registry)
        
        # Mock registry.call to just return whatever was sent in body
        self.mock_registry.call.side_effect = lambda name, args, ctx: {"id": "q-123", **args.get("body", {})}

    def test_all_questions_pass_on_first_attempt(self):
        # 1. Mock first LLM call (Initial generation of 2 questions)
        initial_questions = [
            {
                "type": "mcq",
                "prompt": "What is 2 + 2?",
                "options": ["4", "5", "6"],
                "answerKey": 0,
                "explanation": "Correct",
                "points": 1.0,
                "orderNo": 1
            },
            {
                "type": "essay",
                "prompt": "Write about photosynthesis.",
                "points": 5.0,
                "orderNo": 2
            }
        ]
        
        # 2. Mock verifier LLM call
        verifier_response = {
            "resolvedAnswer": 0,
            "isValid": True,
            "issueDescription": None
        }

        # Setup side effects for self.mock_llm.generate
        self.mock_llm.generate.side_effect = [
            # Call 1: initial generator prompt
            LlmResponse(text=json.dumps(initial_questions), model="test", input_tokens=10, output_tokens=10),
            # Call 2: verifier prompt for MCQ (essay skips verifier)
            LlmResponse(text=json.dumps(verifier_response), model="test", input_tokens=5, output_tokens=5),
        ]

        state: RuntimeState = {
            "resource_id": "exam-123",
            "options": {
                "numberOfQuestions": 2,
                "questionTypes": ["mcq", "essay"]
            },
            "tool_context": {}
        }

        result = self.profile.run(state)
        
        # Check output
        questions = result["metadata"]["questions"]
        self.assertEqual(len(questions), 2)
        self.assertEqual(questions[0]["prompt"], "What is 2 + 2?")
        self.assertEqual(questions[1]["prompt"], "Write about photosynthesis.")
        
        # We called LLM 2 times: 1 for gen, 1 for verifier of MCQ
        self.assertEqual(self.mock_llm.generate.call_count, 2)

    def test_one_question_fails_and_regenerated(self):
        # 1. Mock first LLM call (Initial generation of 2 MCQ questions)
        initial_questions = [
            {
                "type": "mcq",
                "prompt": "Question 1",
                "options": ["A", "B"],
                "answerKey": 0,
                "orderNo": 1
            },
            {
                "type": "mcq",
                "prompt": "Question 2",
                "options": ["C", "D"],
                "answerKey": 1,
                "orderNo": 2
            }
        ]
        
        # Mock verifier responses
        # Question 1: solver gets resolvedAnswer = 1 (mismatch)
        q1_verifier_res = {
            "resolvedAnswer": 1,
            "isValid": True,
            "issueDescription": "answer mismatch"
        }
        # Question 2: solver gets resolvedAnswer = 1 (correct)
        q2_verifier_res = {
            "resolvedAnswer": 1,
            "isValid": True,
            "issueDescription": None
        }
        
        # Mock regeneration response
        replacement_questions = [
            {
                "type": "mcq",
                "prompt": "Question 3 (Replacement)",
                "options": ["E", "F"],
                "answerKey": 0,
                "orderNo": 1
            }
        ]
        
        # Mock verification for replacement Question 3 (correct)
        q3_verifier_res = {
            "resolvedAnswer": 0,
            "isValid": True,
            "issueDescription": None
        }

        self.mock_llm.generate.side_effect = [
            # Call 1: initial generation
            LlmResponse(text=json.dumps(initial_questions), model="test", input_tokens=10, output_tokens=10),
            # Call 2: verify Q1 (fails)
            LlmResponse(text=json.dumps(q1_verifier_res), model="test", input_tokens=5, output_tokens=5),
            # Call 3: verify Q2 (succeeds)
            LlmResponse(text=json.dumps(q2_verifier_res), model="test", input_tokens=5, output_tokens=5),
            # Call 4: regeneration of 1 question
            LlmResponse(text=json.dumps(replacement_questions), model="test", input_tokens=15, output_tokens=15),
            # Call 5: verify Q3 (succeeds)
            LlmResponse(text=json.dumps(q3_verifier_res), model="test", input_tokens=5, output_tokens=5),
        ]

        state: RuntimeState = {
            "resource_id": "exam-123",
            "options": {
                "numberOfQuestions": 2,
                "questionTypes": ["mcq"]
            },
            "tool_context": {}
        }

        result = self.profile.run(state)
        questions = result["metadata"]["questions"]
        
        # Verify that verified questions are Q2 and Q3
        self.assertEqual(len(questions), 2)
        prompts = [q["prompt"] for q in questions]
        self.assertIn("Question 2", prompts)
        self.assertIn("Question 3 (Replacement)", prompts)
        self.assertNotIn("Question 1", prompts)
        
        self.assertEqual(self.mock_llm.generate.call_count, 5)

    def test_max_retry_limit_falls_back_to_best_effort(self):
        # 1. Initial generation of 1 question
        initial_questions = [
            {
                "type": "mcq",
                "prompt": "Question 1",
                "options": ["A", "B"],
                "answerKey": 0,
                "orderNo": 1
            }
        ]
        
        # Verifier always returns failure
        verifier_fail = {
            "resolvedAnswer": 1,
            "isValid": False,
            "issueDescription": "logical flaw"
        }
        
        # Replacement generations
        replacement_attempt_2 = [
            {
                "type": "mcq",
                "prompt": "Question 2",
                "options": ["C", "D"],
                "answerKey": 0,
                "orderNo": 1
            }
        ]
        
        replacement_attempt_3 = [
            {
                "type": "mcq",
                "prompt": "Question 3",
                "options": ["E", "F"],
                "answerKey": 0,
                "orderNo": 1
            }
        ]

        self.mock_llm.generate.side_effect = [
            # Attempt 1: Generate initial
            LlmResponse(text=json.dumps(initial_questions), model="test", input_tokens=10, output_tokens=10),
            # Attempt 1: Verify Q1 (fails)
            LlmResponse(text=json.dumps(verifier_fail), model="test", input_tokens=5, output_tokens=5),
            
            # Attempt 2: Regen replacement Q2
            LlmResponse(text=json.dumps(replacement_attempt_2), model="test", input_tokens=15, output_tokens=15),
            # Attempt 2: Verify Q2 (fails)
            LlmResponse(text=json.dumps(verifier_fail), model="test", input_tokens=5, output_tokens=5),
            
            # Attempt 3: Regen replacement Q3
            LlmResponse(text=json.dumps(replacement_attempt_3), model="test", input_tokens=15, output_tokens=15),
            # Attempt 3: Verify Q3 (fails)
            LlmResponse(text=json.dumps(verifier_fail), model="test", input_tokens=5, output_tokens=5),
        ]

        state: RuntimeState = {
            "resource_id": "exam-123",
            "options": {
                "numberOfQuestions": 1,
                "questionTypes": ["mcq"]
            },
            "tool_context": {}
        }

        result = self.profile.run(state)
        questions = result["metadata"]["questions"]
        
        # Should stop after 3 attempts and backfill from history to meet requested count (1)
        self.assertEqual(len(questions), 1)
        self.assertEqual(self.mock_llm.generate.call_count, 6)


if __name__ == "__main__":
    unittest.main()
