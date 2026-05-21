# Phase 05: Tools, Providers, RAG, Memory, Workers

## Goal

Establish deterministic local foundations for tool calls, model providers, RAG,
session memory, worker lifecycle, material ingestion, and chat orchestration.

## Status

Done foundation. The current code uses fake/local implementations so default
verification does not require OpenAI, Qdrant, Redis, RabbitMQ, Cloudinary, or
Clerk secrets.

## Related Modules

- `apps/ai-service/src/ai_service/tools`
- `apps/ai-service/src/ai_service/providers`
- `apps/ai-service/src/ai_service/rag`
- `apps/ai-service/src/ai_service/memory`
- `apps/ai-service/src/ai_service/workers`
- `apps/ai-service/src/ai_service/orchestrator`

## Lib Dependencies

Tools should wrap BE Core operations through shared gRPC contracts. RAG chunks
and citations should reference BE-owned material IDs and chunk IDs, while vector
payloads stay adapter-owned.

## Verify

```sh
npm exec nx lint ai-service
npm exec nx typecheck ai-service
```

## Next Step

Replace fakes incrementally: BE Core gRPC client first, then Qdrant, Redis,
RabbitMQ, object storage, and OpenAI-compatible provider adapters.

