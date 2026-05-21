# Phase 12: Assessment Grading And Roadmap Workers

## Goal

Add deterministic AI workers for assessment grading and learning roadmap
generation.

## Implementation

- Grading worker loads submission, questions, and rubric by ID.
- Grading worker calls fake LLM first and writes grading results through BE Core.
- Roadmap worker loads mastery, progress, and context by ID.
- Roadmap worker creates roadmap draft and writes roadmap/items through BE Core.
- Missing domain context must map to failed job status with structured error.

## Acceptance

- Rubric fixture grading is deterministic.
- Roadmap fixture output is deterministic.
- Missing context marks job failed.
- No worker writes directly to PostgreSQL LMS tables.

## References

- [OpenAI text generation guide](https://platform.openai.com/docs/guides/text)
- [pytest documentation](https://docs.pytest.org/en/stable/contents.html)

