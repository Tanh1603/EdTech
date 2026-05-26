# Phase 13: Multi-Agent Observability And Local Compose

## Goal

Add production-oriented observability and local infrastructure wiring after the
core health, gRPC, and shared multi-agent runtime paths are stable.

## Implementation

- Add structured JSON logs with request, correlation, job, agent profile, graph
  node, tool, model, vector, latency, and token metadata.
- Add TutorAgent log steps for `context.load`, `memory.load`,
  `intent.detected`, `query.rewritten`, `retrieval.summary`,
  `retrieval.semantic`, `prompt.built`, `model.stream`,
  `response.sanitized`, and `persistence.saved`.
- Add material ingest log steps for `qdrant.delete_material`,
  `qdrant.upsert.batch`, and `chunk_manifest.write.batch`.
- Add OpenTelemetry spans for gRPC, LangGraph nodes, worker jobs, tool calls,
  model calls, and vector search.
- Add Qdrant and AI Service profile to `docker-compose.yml` after runtime
  endpoints are stable.
- Do not log full prompts or chunk content by default.

## Acceptance

- Local compose infra starts with required services.
- Logs include `requestId`, `correlationId`, `agentProfile`, and `graphNode`.
- Logs expose intent, retrieval mode, material status, chunk count, and top
  retrieval score without private prompt/body content.
- Traces can connect gRPC requests, LangGraph nodes, worker jobs, model calls,
  and vector search.

## References

- [OpenTelemetry Python](https://opentelemetry.io/docs/languages/python/)
- [Docker Compose documentation](https://docs.docker.com/compose/)
