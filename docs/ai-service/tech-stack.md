# AI Service Tech Stack

This stack is optimized for the current repository: Nx/NestJS services already
exist for Gateway and BE Core, while AI Service should use the Python AI
ecosystem without becoming a separate source of LMS truth.

## Runtime

| Layer | Choice | Reason |
| --- | --- | --- |
| Language | Python 3.12 | Stable deployment target with broad AI library support. Avoid Python 3.14 for now because package and CI support is still uneven. |
| Package manager | `uv` | Fast lock/install workflow and simple app-local project management. |
| Ops HTTP API | FastAPI + Pydantic v2 | Health, readiness, metrics, and private admin endpoints only. |
| Internal RPC | `grpcio` + Protobuf | Typed unary calls and server-streaming for AI token/state streams. |
| App server | Uvicorn/Gunicorn | Standard container runtime for FastAPI health endpoints. |

## AI Runtime

| Capability | Choice | V1 Rule |
| --- | --- | --- |
| Orchestration | Custom lightweight state machine | Start simple; move to LangGraph only when branching/retry/state complexity justifies it. |
| Tool calling | Local typed tool registry | MCP is optional after V1; keep tools auditable and typed first. |
| LLM provider | OpenAI-compatible provider abstraction | Keep model/provider swappable and keep secrets only in AI Service. |
| Embeddings | Provider abstraction | Store model, provider, dimension, and version metadata with embeddings. |
| Prompt registry | Versioned files/config | Separate system, user, tool, and business-domain policy prompts. |

## Retrieval And Memory

| Capability | Choice | Purpose |
| --- | --- | --- |
| Vector DB | Qdrant gRPC | Production-like semantic search and vector upsert/delete. |
| Short-lived memory | Redis | Agent scratchpad, session context, execution state, token budget counters. |
| Durable chat history | BE Core PostgreSQL | User-visible conversation state must be stored through BE Core. |
| RAG metadata | BE Core `MaterialChunk` + Qdrant payload | BE Core owns material/chunk records; Qdrant owns vectors and payload index. |

## Async Work

| Capability | Choice | Purpose |
| --- | --- | --- |
| Queue | RabbitMQ | Durable queues, retries, ack/nack, DLQ, Python worker compatibility. |
| Job status | BE Core DB `jobs` | Queryable audit/status source for clients and operators. |
| Workers | Python worker processes | Material ingestion, embedding, grading, roadmap, recommendation, and chat title jobs. |

## Parsing And Storage

| Area | Choice |
| --- | --- |
| PDF parsing | `pypdf` |
| DOCX parsing | `python-docx` |
| PPTX parsing | `python-pptx` |
| Complex parsing | Add Unstructured only when fixture coverage proves it is needed. |
| Object storage | Cloudinary now; S3/R2-compatible abstraction later. |

## Observability And Security

- Use structured JSON logs with `requestId`, `correlationId`, `jobId`, `userId`,
  `model`, latency, token usage, and tool-call names.
- Add OpenTelemetry spans for Gateway -> BE -> AI, model calls, vector search,
  tool calls, and worker jobs.
- Do not log raw private prompts or provider secrets by default.
- Require `SERVICE_TOKEN` for internal gRPC outside local development; allow mTLS
  as a later hardening step.

## Test Defaults

- Default CI uses fake LLM/embedding providers and mocked external services.
- Real OpenAI/Cloudinary/Qdrant/RabbitMQ integrations are opt-in environment
  tests only.
- Contract tests must load every configured proto file and assert service/method
  constants match expected names.
