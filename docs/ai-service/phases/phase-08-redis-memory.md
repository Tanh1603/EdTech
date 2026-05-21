# Phase 08: Redis Memory

## Goal

Add short-lived memory for session scratchpads, interactive state, and token
budget counters without storing durable chat history in Redis.

## Implementation

- Create a Redis wrapper behind the memory interface.
- Keep memory modules under `ai_service/agents/memory`.
- Keep an in-memory fake implementation for local/offline verification.
- Implement session scratchpad keys with TTL.
- Implement interactive memory TTL and token budget counters.
- Keep final chat messages and durable user-visible history in BE Core.

## Acceptance

- Memory key naming is consistent.
- TTL behavior is explicit.
- In-memory fake and Redis wrapper share the same interface.
- Durable chat history never depends on Redis as the source of truth.

## References

- [redis-py guide](https://redis.io/docs/latest/develop/clients/redis-py/)
