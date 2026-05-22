# Phase 08: Redis Memory

## Goal

Add short-lived memory for session scratchpads, interactive state, and token
budget counters without storing durable chat history in Redis.

## Implementation

- Use the `redis` Python client for the real Redis wrapper behind the memory
  interface.
- Keep memory modules under `apps/ai-service/src/agents/memory`.
- Keep the in-memory implementation only for local/offline verification and
  dependency injection.
- Implement session scratchpad keys with TTL.
- Implement interactive memory TTL and token budget counters.
- Keep final chat messages and durable user-visible history in BE Core.

## Acceptance

- Memory key naming is consistent.
- TTL behavior is explicit.
- In-memory memory and Redis wrapper share the same interface.
- `docker compose up -d redis` starts the local memory/cache service.
- Durable chat history never depends on Redis as the source of truth.

## References

- [redis-py guide](https://redis.io/docs/latest/develop/clients/redis-py/)
