# Phase 11: LangGraph TutorAgent Chat Generation

## Goal

Implement the shared LangGraph runtime first for the `TutorAgent`, then expose
unary and streaming chat behavior through the AI gRPC service.

## Implementation

- Add shared runtime nodes: planner, reasoner, tool selector, tool executor,
  context loading, memory, intent routing, query rewriting, retrieval routing,
  prompt building, response guard, and persistence.
- Route `GenerateChatResponse` and `StreamChatResponse` to `TutorAgent`.
- Keep orchestration code under `apps/ai-service/src/agents/runtime` and
  `apps/ai-service/src/agents/profiles`.
- Load delegated context and authorization scope.
- Retrieve material context through retrieval-router mode:
  `summary_material`, `qa_material`, `follow_up`, or `general_tutor`.
- Build prompt input from sanitized session history, message, retrieval, memory,
  and policy context.
- Generate through the provider interface.
- Validate and persist the assistant message through BE Core.
- Implement `GenerateChatResponse` with the existing Groq provider abstraction.
- Implement `StreamChatResponse` as gRPC server streaming.
- Keep Gateway SSE bridge as a separate API Gateway phase.

## Acceptance

- Unary chat returns an assistant message.
- Streaming emits token deltas and a final marker.
- Chat persistence goes through BE Core.
- Summary material questions use ordered chunks and QA questions use semantic
  chunks with score thresholds.
- Corrupted chat history/control characters are sanitized before prompt and
  before persistence.
- Provider-backed smoke checks run only when local Groq/Ollama config is
  available.

## References

- [ReAct paper](https://arxiv.org/abs/2210.03629)
- [LangGraph documentation](https://docs.langchain.com/oss/python/langgraph)
- Local prompt registry under `agents/prompts`.
- [OpenAI streaming guide](https://platform.openai.com/docs/guides/streaming-responses)
