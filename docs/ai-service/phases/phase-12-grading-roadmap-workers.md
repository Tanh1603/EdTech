# Phase 12: LearningPathAgent And AssessmentMaterialAgent Workflows

## Goal

Add the non-chat domain workflows on the shared runtime:
`LearningPathAgent` for roadmap/recommendation and `AssessmentMaterialAgent` for
assessment grading, quiz support, and rubric feedback.

## Implementation

- `AssessmentMaterialAgent` loads submission, questions, rubric, and material
  context by ID.
- `AssessmentMaterialAgent` writes grading results and feedback through BE Core.
- `LearningPathAgent` loads mastery, progress, assessment analytics, and chat
  analytics by ID.
- `LearningPathAgent` creates roadmap/recommendation drafts and writes
  roadmap/items through BE Core.
- Missing domain context must map to failed job status with structured error.

## Acceptance

- Rubric-backed grading output is deterministic for controlled inputs.
- Roadmap output is deterministic for controlled mastery and analytics inputs.
- Recommendations and roadmap outputs are produced by the same profile.
- Missing context marks job failed.
- No worker writes directly to PostgreSQL LMS tables.

## References

- [OpenAI text generation guide](https://platform.openai.com/docs/guides/text)
- [pytest documentation](https://docs.pytest.org/en/stable/contents.html)
