# Phase 11: Orchestrator And Chat Generation

## Goal

Implement the chat execution loop and expose unary and streaming chat behavior
through the AI gRPC service.

## Implementation

- Load delegated context and authorization scope.
- Keep orchestration code under `ai_service/agents/orchestrator`.
- Retrieve material context.
- Build prompt input from session, message, retrieval, and policy context.
- Generate through the provider interface.
- Validate and persist the assistant message through BE Core.
- Implement `GenerateChatResponse` with fake provider first.
- Implement `StreamChatResponse` as gRPC server streaming.
- Keep Gateway SSE bridge as a separate API Gateway phase.

## Acceptance

- Unary chat returns an assistant message.
- Streaming emits token deltas and a final marker.
- Chat persistence goes through BE Core.
- Provider fakes allow local verification without external API keys.

## References

- [ReAct paper](https://arxiv.org/abs/2210.03629)
- [LangGraph documentation](https://docs.langchain.com/oss/python/langgraph)
- [OpenAI streaming guide](https://platform.openai.com/docs/guides/streaming-responses)
