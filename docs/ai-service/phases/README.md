# AI Service Implementation Phases

This folder is the implementation roadmap for `apps/ai-service` with Python
3.14. It breaks the work into small slices from compatibility checks to
production integrations.

## Repository Note

The source plan includes test acceptance criteria, but this repository currently
has no local `ai-service` test target by request. Until tests are restored, use
lint, typecheck, proto generation, and manual/runtime smoke checks for AI Service
verification.

## Phase Index

| Phase | Status | Document |
| --- | --- | --- |
| 00 | Baseline | [Python 3.14 Compatibility Gate](./phase-00-python-314-compatibility.md) |
| 01 | Baseline | [Package Skeleton And Nx Targets](./phase-01-package-and-nx.md) |
| 02 | Baseline | [Internal FastAPI Ops API](./phase-02-fastapi-ops.md) |
| 03 | Baseline | [gRPC AI Server Bootstrap](./phase-03-grpc-ai-server-bootstrap.md) |
| 04 | Baseline | [Settings, Metadata, Error Model](./phase-04-settings-metadata-errors.md) |
| 05 | Baseline | [BE Core Client And Tool Registry](./phase-05-be-core-client-tool-registry.md) |
| 06 | Baseline | [Real Groq LLM And Ollama Embedding Providers](./phase-06-real-providers.md) |
| 07 | Next | [RAG Core](./phase-07-rag-core.md) |
| 08 | Next | [Redis Memory](./phase-08-redis-memory.md) |
| 09 | Next | [RabbitMQ Worker Foundation](./phase-09-rabbitmq-worker-foundation.md) |
| 10 | Next | [Material Ingestion Worker](./phase-10-material-ingestion-worker.md) |
| 11 | Next | [Orchestrator And Chat Generation](./phase-11-orchestrator-chat-generation.md) |
| 12 | Next | [Assessment Grading And Roadmap Workers](./phase-12-grading-roadmap-workers.md) |
| 13 | Next | [Observability And Local Compose](./phase-13-observability-local-compose.md) |

## Default Verification

Use these commands when `uv` and Python 3.14 are available:

```sh
npm exec nx show project ai-service --json
npm exec nx run ai-service:proto:generate
npm exec nx lint ai-service
npm exec nx typecheck ai-service
```

Shared proto source of truth remains in `libs/contracts/proto`. Do not copy proto
definitions into `apps/ai-service`.

## Runtime Package Layout

Agent execution code is consolidated under `apps/ai-service/src/ai_service/agents`.
The top-level `api`, `config`, `contracts`, `grpc`, and `main.py` modules remain
service shell and boundary code.

## Environment Files

AI Service environment files live beside the Python app:

- `apps/ai-service/.env` for local development defaults.
- `apps/ai-service/.env.example` as the template for new environments.

Both files default to real SDK-backed providers: Groq for LLM calls and local
Ollama for free embeddings. Real Groq keys should only be filled in local/private
deployment environments.
