# Phase 06: Real Groq LLM And Ollama Embedding Providers

## Goal

Replace deterministic local stubs with real SDK-backed providers while keeping
the same internal provider protocols for orchestrator, RAG, and workers.

## Implementation

- Use the official Groq Python SDK for LLM generation and streaming.
- Use the official Ollama Python SDK for local free embeddings.
- Default LLM provider: `groq` with model `llama-3.3-70b-versatile`.
- Default embedding provider: `ollama` with model `nomic-embed-text`.
- Keep provider construction behind `create_llm_provider()` and
  `create_embedding_provider()` so runtime code does not import SDK clients
  directly.
- Keep real provider keys only in local/private secret stores or shell
  environment. Do not commit or paste real keys into repo files.

## Environment

```sh
LLM_PROVIDER=groq
GROQ_API_KEY=
LLM_API_KEY=
LLM_MODEL=llama-3.3-70b-versatile
LLM_TEMPERATURE=0.2
LLM_MAX_TOKENS=1024

EMBEDDING_PROVIDER=ollama
EMBEDDING_API_KEY=
OLLAMA_HOST=http://localhost:11434
EMBEDDING_MODEL=nomic-embed-text
```

`GROQ_API_KEY` is preferred. `LLM_API_KEY` remains as a fallback so older local
env files do not break immediately.

If a real Groq key is ever copied into the workspace or logs, rotate it in Groq
before using it again.

## Acceptance

- `GroqLlmProvider.generate()` returns assistant text from Groq Chat
  Completions.
- `GroqLlmProvider.stream()` yields streamed delta content from the Groq SDK.
- `OllamaEmbeddingProvider.embed()` returns a non-empty vector from local Ollama.
- Runtime users depend on `LlmProvider` and `EmbeddingProvider` protocols, not
  concrete fake classes.
- `MaterialIngestWorker` no longer hard-codes a local embedding stub.

## Verification

```sh
python -m compileall apps/ai-service/src
ruff check apps/ai-service/src
rg "Fake(Llm|Embedding)Provider|PROVIDER=fake" apps/ai-service docs/ai-service
```

Runtime smoke:

- Set `GROQ_API_KEY` and call `GroqLlmProvider.generate("ping")`.
- Run `ollama pull nomic-embed-text`, ensure Ollama is serving
  `http://localhost:11434`, and call `OllamaEmbeddingProvider.embed("hello")`.

## References

- [Groq Python SDK on PyPI](https://pypi.org/project/groq/)
- [Groq text generation docs](https://console.groq.com/docs/text-chat)
- [Groq OpenAI compatibility](https://console.groq.com/docs/openai)
- [Ollama Python SDK](https://github.com/ollama/ollama-python)
- [Ollama Python package](https://pypi.org/project/ollama/0.6.2/)
- [Ollama embed API](https://docs.ollama.com/api/embed)
- [nomic-embed-text model](https://ollama.com/library/nomic-embed-text)
