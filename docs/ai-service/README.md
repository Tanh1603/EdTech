# AI Service Documentation

This folder is the source of truth for the AI Service design. The service lives in
`apps/ai-service` and is an internal runtime for orchestration, RAG, model calls,
memory, tool execution, and AI workers.

## Current Status

- `apps/ai-service` exists with a minimal Python skeleton: `main.py`,
  `pyproject.toml`, `uv.lock`, and `README.md`.
- The skeleton does not yet contain the target package structure, gRPC server,
  workers, orchestrator, RAG pipeline, Redis/Qdrant clients, LLM provider, prompt
  registry, MCP server, or tool registry.
- `apps/api-gateway` is the public ingress and already calls BE Core through
  shared gRPC contracts.
- `apps/backend` is the BE Core and remains the source of truth for LMS domain
  state.
- AI contracts are defined under `libs/contracts/proto/ai`; TypeScript constants
  live under `libs/contracts/src/grpc`.

## Documents

- [Architecture](./architecture.md): service boundaries, container diagram, module
  layout, and ownership rules.
- [Tech Stack](./tech-stack.md): runtime, framework, storage, RAG, queue, memory,
  observability, and testing decisions.
- [Research Notes](./research.md): agent, RAG, memory, tool calling, evaluation,
  and security research notes.
- [Runtime Flows](./runtime-flows.md): material ingestion, RAG chat, grading, and
  roadmap generation flows.
- [ADR Index](./adr/README.md): short architecture decision records.

## Design Rule

AI Service is not a public browser-facing backend and must not write LMS domain
tables directly. Public clients enter through API Gateway; domain authorization
and durable state stay in BE Core; AI Service receives IDs/context and writes
final results back through BE Core gRPC.
