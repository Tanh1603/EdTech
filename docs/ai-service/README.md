# AI Service Documentation

This folder is the source of truth for the AI Service design. The service lives in
`apps/ai-service` and is an internal runtime for orchestration, RAG, model calls,
memory, tool execution, and AI workers.

## Current Status

- `apps/ai-service` now contains the Python 3.14 package structure, Nx targets,
  gRPC/codegen helpers, metadata and
  error utilities, a consolidated `agents/` runtime package for real
  Groq/Ollama providers, typed tools, Qdrant RAG, Redis session memory,
  RabbitMQ workers, a LangGraph/LangChain shared runtime, and generated Python
  protobuf modules emitted from shared lib contracts.
- MCP server and Gateway SSE bridge remain outside V1. AI Service exposes gRPC
  server streaming for chat tokens; Gateway translates that stream to
  browser-facing SSE.
- V1 architecture uses one shared LangGraph runtime with three domain profiles:
  `TutorAgent`, `LearningPathAgent`, and `AssessmentMaterialAgent`.
- `apps/api-gateway` is the public ingress and already calls BE Core through
  shared gRPC contracts.
- `apps/backend` is the BE Core and remains the source of truth for LMS domain
  state.
- AI contracts are defined under `libs/contracts/proto/ai`; TypeScript constants
  live under `libs/contracts/src/grpc`.
- `apps/ai-service` must consume those shared lib contracts through codegen; it
  must not define duplicate proto/schema files locally.

## Documents

- [Architecture](./architecture.md): service boundaries, container diagram, module
  layout, and ownership rules.
- [Tech Stack](./tech-stack.md): runtime, framework, storage, RAG, queue, memory,
  observability, and verification decisions.
- [Research Notes](./research.md): agent, RAG, memory, tool calling, evaluation,
  and security research notes.
- [Runtime Flows](./runtime-flows.md): material ingestion, RAG chat, grading, and
  roadmap generation flows.
- [References](./references.md): official docs, infrastructure references, and
  research papers.
- [Implementation Phases](./phases/README.md): completed AI Service phases and
  next implementation slices.
- [ADR Index](./adr/README.md): short architecture decision records.

## Design Rule

AI Service is not a public browser-facing backend and must not write LMS domain
tables directly. Public clients enter through API Gateway; domain authorization
and durable state stay in BE Core; AI Service receives IDs/context and writes
final results back through BE Core gRPC.
