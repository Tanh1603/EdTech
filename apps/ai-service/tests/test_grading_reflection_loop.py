import unittest
from unittest.mock import Mock, patch
import json
import sys
import os

# Add src/ folder to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))

from agents.orchestrator.graph import AgentRuntime
from agents.profiles.assessment_material import AssessmentMaterialAgentProfile
from agents.orchestrator.state import RuntimeState
from agents.providers.llm_provider import LlmResponse


class TestGradingReflectionLoop(unittest.TestCase):
    def setUp(self):
        self.mock_llm = Mock()
        self.mock_registry = Mock()
        self.profile = AssessmentMaterialAgentProfile(self.mock_llm, self.mock_registry)
        
        # Mock registry.call to just return whatever was sent in body
        self.mock_registry.call.side_effect = lambda name, args, ctx: {"id": "g-123", **args.get("body", {})}

    def test_grading_passes_on_first_attempt(self):
        # 1. Grader output
        grader_res = {
            "score": 8.0,
            "maxScore": 10.0,
            "feedback": {
                "comment": "Good job.",
                "perQuestionFeedback": {
                    "q1": {"score": 4.0, "maxScore": 5.0, "comment": "Good"},
                    "q2": {"score": 4.0, "maxScore": 5.0, "comment": "Good"}
                }
            }
        }
        
        # 2. Critic output
        critic_res = {
            "isValid": True,
            "critiqueDescription": None,
            "inconsistentQuestions": []
        }

        self.mock_llm.generate.side_effect = [
            # Call 1: Grader
            LlmResponse(text=json.dumps(grader_res), model="test", input_tokens=10, output_tokens=10),
            # Call 2: Critic
            LlmResponse(text=json.dumps(critic_res), model="test", input_tokens=5, output_tokens=5),
        ]

        state: RuntimeState = {
            "resource_id": "sub-123",
            "options": {},
            "tool_context": {}
        }

        result = self.profile.run(state)
        grading_res = result["metadata"]["gradingResult"]
        
        self.assertEqual(grading_res["score"], 8.0)
        self.assertEqual(self.mock_llm.generate.call_count, 2)

    def test_grading_fails_first_attempt_revises_and_passes(self):
        # 1. Grader initial output (score mismatch: sum is 8, overall is 7)
        grader_initial = {
            "score": 7.0,
            "maxScore": 10.0,
            "feedback": {
                "comment": "Good.",
                "perQuestionFeedback": {
                    "q1": {"score": 4.0, "maxScore": 5.0, "comment": "Good"},
                    "q2": {"score": 4.0, "maxScore": 5.0, "comment": "Good"}
                }
            }
        }
        
        # 2. Critic output (failure)
        critic_fail = {
            "isValid": False,
            "critiqueDescription": "Arithmetic error: sum is 8 but score is 7",
            "inconsistentQuestions": []
        }
        
        # 3. Revision output (corrected)
        grader_revision = {
            "score": 8.0,
            "maxScore": 10.0,
            "feedback": {
                "comment": "Good.",
                "perQuestionFeedback": {
                    "q1": {"score": 4.0, "maxScore": 5.0, "comment": "Good"},
                    "q2": {"score": 4.0, "maxScore": 5.0, "comment": "Good"}
                }
            }
        }
        
        # 4. Critic output (success)
        critic_success = {
            "isValid": True,
            "critiqueDescription": None,
            "inconsistentQuestions": []
        }

        self.mock_llm.generate.side_effect = [
            # Call 1: Grader initial
            LlmResponse(text=json.dumps(grader_initial), model="test", input_tokens=10, output_tokens=10),
            # Call 2: Critic initial review (fail)
            LlmResponse(text=json.dumps(critic_fail), model="test", input_tokens=5, output_tokens=5),
            # Call 3: Revision
            LlmResponse(text=json.dumps(grader_revision), model="test", input_tokens=15, output_tokens=15),
            # Call 4: Critic review of revision (pass)
            LlmResponse(text=json.dumps(critic_success), model="test", input_tokens=5, output_tokens=5),
        ]

        state: RuntimeState = {
            "resource_id": "sub-123",
            "options": {},
            "tool_context": {}
        }

        result = self.profile.run(state)
        grading_res = result["metadata"]["gradingResult"]
        
        self.assertEqual(grading_res["score"], 8.0)
        self.assertEqual(self.mock_llm.generate.call_count, 4)

    def test_grading_max_retries_falls_back(self):
        grader_draft = {
            "score": 5.0,
            "maxScore": 10.0,
            "feedback": {
                "comment": "Nice try.",
                "perQuestionFeedback": {}
            }
        }
        
        critic_fail = {
            "isValid": False,
            "critiqueDescription": "Always wrong score",
            "inconsistentQuestions": []
        }

        self.mock_llm.generate.side_effect = [
            # Attempt 1
            LlmResponse(text=json.dumps(grader_draft), model="test", input_tokens=10, output_tokens=10), # Grader
            LlmResponse(text=json.dumps(critic_fail), model="test", input_tokens=5, output_tokens=5),    # Critic
            # Attempt 2
            LlmResponse(text=json.dumps(grader_draft), model="test", input_tokens=10, output_tokens=10), # Revision
            LlmResponse(text=json.dumps(critic_fail), model="test", input_tokens=5, output_tokens=5),    # Critic
            # Attempt 3
            LlmResponse(text=json.dumps(grader_draft), model="test", input_tokens=10, output_tokens=10), # Revision
            LlmResponse(text=json.dumps(critic_fail), model="test", input_tokens=5, output_tokens=5),    # Critic
        ]

        state: RuntimeState = {
            "resource_id": "sub-123",
            "options": {},
            "tool_context": {}
        }

        result = self.profile.run(state)
        grading_res = result["metadata"]["gradingResult"]
        
        self.assertEqual(grading_res["score"], 5.0)
        self.assertEqual(self.mock_llm.generate.call_count, 6)


if __name__ == "__main__":
    unittest.main()
