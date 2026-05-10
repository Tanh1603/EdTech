# AI Service Docs

This folder documents the target AI Service architecture derived from `docs/architechture.webp` and shaped for the current repository.

Current status:

- `apps/ai-service/` exists but has no implementation files yet.
- API Gateway and BE Core already exist.
- Gateway -> BE Core gRPC is implemented through shared contracts in `libs/contracts`.
- AI Service runtime, AI proto contracts, workers, event bus, memory, MCP, and vector DB integrations are not implemented yet.
- The recommended design is hybrid: gRPC for synchronous typed calls/streaming and RabbitMQ-backed DB jobs for long-running event-driven AI jobs.

Start here:

- [Architecture](./architecture.md)
