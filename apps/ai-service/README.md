# AI Service

Internal AI orchestration, RAG, and worker service for EdTech.

## Current Status

This app is a skeleton only. It has a minimal Python entrypoint and dependency
metadata, but it does not yet implement the target package structure, gRPC
services, workers, RAG, Redis/Qdrant clients, LLM providers, prompt registry, or
tool registry.

## Runtime Target

- Python 3.12.
- `uv` for dependency management.
- FastAPI for internal health/readiness/metrics endpoints.
- `grpcio` + Protobuf for internal service APIs.
- RabbitMQ + BE Core DB `jobs` for long-running AI work.
- Redis for short-lived execution/session memory.
- Qdrant for vector search.

Detailed design lives in `docs/ai-service`.
