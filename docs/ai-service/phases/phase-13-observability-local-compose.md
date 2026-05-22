# Phase 13: Multi-Agent Observability And Local Compose

## Goal

Add production-oriented observability and local infrastructure wiring after the
core health, gRPC, and shared multi-agent runtime paths are stable.

## Implementation

- Add structured JSON logs with request, correlation, job, agent profile, graph
  node, tool, model, vector, latency, and token metadata.
- Add OpenTelemetry spans for gRPC, LangGraph nodes, worker jobs, tool calls,
  model calls, and vector search.
- Add Qdrant and AI Service profile to `docker-compose.yml` after runtime
  endpoints are stable.
- Ensure `/health` and `/ready` remain useful in compose.

## Acceptance

- Local compose infra starts with required services.
- AI Service `/health` and `/ready` work in compose.
- Logs include `requestId`, `correlationId`, `agentProfile`, and `graphNode`.
- Traces can connect gRPC requests, LangGraph nodes, worker jobs, model calls,
  and vector search.

## References

- [OpenTelemetry Python](https://opentelemetry.io/docs/languages/python/)
- [Docker Compose documentation](https://docs.docker.com/compose/)
