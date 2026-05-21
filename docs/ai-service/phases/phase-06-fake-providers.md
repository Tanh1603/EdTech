# Phase 06: Fake LLM And Fake Embedding Providers

## Goal

Provide deterministic model and embedding providers before wiring real external
LLM infrastructure.

## Implementation

- Add `ai_service/agents/providers/llm_provider.py`.
- Add `ai_service/agents/providers/embedding_provider.py`.
- Implement fake text generation, fake streaming, and fake embedding vectors.
- Add OpenAI-compatible provider adapters only after fake providers are stable.
- Keep default verification free of API keys and external services.

## Acceptance

- Fake text generation returns stable content.
- Fake streaming emits deterministic token/state chunks.
- Fake embeddings are stable for the same input text.
- Provider interfaces can later wrap OpenAI-compatible APIs without changing
  orchestrator code.

## References

- [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses)
- [OpenAI text generation guide](https://platform.openai.com/docs/guides/text)
- [OpenAI streaming guide](https://platform.openai.com/docs/guides/streaming-responses)
- [OpenAI embeddings API](https://platform.openai.com/docs/api-reference/embeddings/create)
