# AI Service

Internal AI orchestration, RAG, and worker service for EdTech.

## Current Status

This app has the initial Python 3.14 foundation: package structure, internal
FastAPI ops endpoints, Nx targets, gRPC/codegen helpers, metadata and error
utilities, and a consolidated `agents/` runtime package for real Groq/Ollama
providers, typed tools, RAG primitives, in-memory session memory, worker
foundations, and a lightweight chat orchestrator.

It uses `libs/contracts/proto` as the only protobuf source of truth. Generated
Python modules are emitted from that lib into `src/ai_service/contracts/generated`
for this runtime; do not define separate AI service proto/schema files inside
this app.

It still needs real Redis/Qdrant/RabbitMQ adapters, MCP integration if needed,
and Gateway SSE bridge work.

## Runtime Target

- Python 3.14 on standard CPython. Free-threaded/no-GIL builds are out of V1.
- `uv` for dependency management.
- FastAPI for internal health/readiness/metrics endpoints.
- `grpcio` + Protobuf for internal service APIs.
- RabbitMQ + BE Core DB `jobs` for long-running AI work.
- Redis for short-lived execution/session memory.
- Qdrant for vector search.

Detailed design lives in `docs/ai-service`.

## Environment

Local runtime settings live in `.env`; the committed template is `.env.example`.
Default local providers are Groq for LLM calls and local Ollama for free
embeddings. Do not commit a real `GROQ_API_KEY`.

## Local Commands

Run from the repository root through Nx once dependencies are synced:

```sh
npm exec nx lint ai-service
npm exec nx typecheck ai-service
npm exec nx run ai-service:proto:generate
npm exec nx serve ai-service
```

Run inside the app directory with `uv`:

```sh
uv sync
uv run uvicorn --app-dir src ai_service.main:app --host 0.0.0.0 --port 8090
uv run python src/ai_service/contracts/generate_proto.py
```

This service intentionally has no local test target right now. Verification is
handled through lint, compile/type smoke checks, proto generation, and shared
contract validation from `libs/contracts`.
