# AI Service Tech Stack

This stack is optimized for the current repository: Nx/NestJS services already
exist for Gateway and BE Core, while AI Service should use the Python AI
ecosystem without becoming a separate source of LMS truth.

## Runtime

| Layer | Choice | Reason |
| --- | --- | --- |
| Language | Python 3.14 | Project runtime target. Use standard CPython 3.14 first; free-threaded/no-GIL builds are out of V1. |
| Package manager | `uv` | Fast lock/install workflow and simple app-local project management. |
| Ops HTTP API | FastAPI + Pydantic v2 | Health, readiness, metrics, and private admin endpoints only. |
| Internal RPC | `grpcio` + Protobuf | Typed unary calls and server-streaming for AI token/state streams. |
| App server | Uvicorn/Gunicorn | Standard container runtime for FastAPI health endpoints. |

## AI Runtime

| Capability | Choice | V1 Rule |
| --- | --- | --- |
| Orchestration | LangGraph `StateGraph` | Use one shared graph runtime with routing to three domain agent profiles. |
| Agent/profile glue | LangChain | Prompt templates, tool wrappers, retriever composition, messages, and model adapter glue. |
| Tool calling | Local typed tool registry | MCP is optional after V1; keep tools auditable and typed first. |
| LLM provider | Groq SDK behind provider abstraction | Use fast Groq-hosted chat models now while keeping model/provider swappable. |
| Embeddings | Ollama SDK behind provider abstraction | Use free local embeddings for development and RAG ingestion without API cost. |
| Prompt registry | Versioned files/config | Separate system, user, tool, and business-domain policy prompts. |

## Agent Profiles

V1 uses one shared runtime and three agent profiles:

| Profile | Purpose |
| --- | --- |
| `TutorAgent` | Chat tutor, RAG answer generation, citations, assistant message persistence. |
| `LearningPathAgent` | Roadmap generation, recommendations, next actions, mastery-aware learning paths. |
| `AssessmentMaterialAgent` | Material ingestion, quiz generation, grading, rubric feedback, chunk sync. |

Planner, reasoner, and tool selector are LangGraph runtime nodes, not product
agents.

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

## Verification Defaults

- Phase 0 must keep dependency install, lint/typecheck, and gRPC code generation
  working before larger runtime work.
- Default verification uses SDK-backed Groq/Ollama providers when local
  credentials/services are available, plus mocked infrastructure services.
- Cloudinary/Qdrant/RabbitMQ integrations are opt-in environment checks only.
- Shared contract validation stays in `libs/contracts`; AI Service consumes the
  generated Python modules from those shared proto files.
