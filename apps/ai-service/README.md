# AI Service

Internal AI orchestration, RAG, and worker service for EdTech.

## Current Status

This app has the Python 3.14 foundation: package structure, Nx targets,
gRPC/codegen helpers, metadata and error
utilities, and a consolidated `agents/` runtime package for real Groq/Ollama
providers, typed tools, Qdrant-backed RAG primitives, Redis session memory, worker
foundations, and a LangGraph/LangChain shared runtime for TutorAgent,
LearningPathAgent, and AssessmentMaterialAgent.

It uses `libs/contracts/proto` as the only protobuf source of truth. Generated
Python modules are emitted from that lib into `src/contracts/generated`
for this runtime; do not define separate AI service proto/schema files inside
this app.

MCP integration and the Gateway SSE bridge remain separate follow-up work.

## Runtime Target

- Python 3.14 on standard CPython. Free-threaded/no-GIL builds are out of V1.
- `uv` for dependency management.
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
npm exec nx run ai-service:grpc
npm exec nx run ai-service:worker
```

Run inside the app directory with `uv`:

```sh
uv sync
uv run python src/contracts/generate_proto.py
uv run python -c "import sys; sys.path.insert(0, 'src'); from agents.grpc.server import serve; serve()"
uv run python -c "import sys; sys.path.insert(0, 'src'); from agents.workers.main import main; main()"
```

This service intentionally has no local test target right now. Verification is
handled through lint, compile/type smoke checks, proto generation, and shared
contract validation from `libs/contracts`.
