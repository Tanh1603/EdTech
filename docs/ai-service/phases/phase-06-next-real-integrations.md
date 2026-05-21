# Phase 06: Real Integrations

## Goal

Move from deterministic foundations to production adapters without changing the
public Gateway or BE Core request paths.

## Status

Next. This phase is not implemented yet.

## Implementation Order

1. BE Core gRPC client wrappers for domain reads/writes and job status updates.
2. Qdrant vector store adapter using the existing RAG interfaces.
3. Redis memory adapter behind the current session memory interface.
4. RabbitMQ worker transport with ack/nack, retry metadata, and graceful shutdown.
5. Object storage download adapter for signed URLs or Cloudinary URLs.
6. OpenAI-compatible LLM and embedding providers behind the existing provider
   abstractions.
7. Gateway SSE bridge only after `StreamChatResponse` is stable internally.

## Lib Dependencies

Keep using `libs/contracts/proto` and TypeScript gRPC constants from
`libs/contracts/src/grpc`. Do not copy proto definitions into `apps/ai-service`.

## Verify

```sh
npm exec nx run ai-service:proto:generate
npm exec nx lint ai-service
npm exec nx typecheck ai-service
```

Run integration checks manually or in opt-in jobs only when real infrastructure
and secrets are available.

## Next Step

Start with the BE Core client because every real worker and orchestrator flow
needs BE-owned authorization, domain context, and durable writes.

