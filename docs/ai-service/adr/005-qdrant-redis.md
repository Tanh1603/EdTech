# ADR-005: Qdrant And Redis

## Decision

Qdrant is the target vector DB for RAG. Redis is used for short-lived execution
and session memory.

## Reason

Qdrant gives a production-like vector search boundary. Redis is suitable for
scratchpad state and token budget counters, but not for durable chat history or
final AI outputs.
