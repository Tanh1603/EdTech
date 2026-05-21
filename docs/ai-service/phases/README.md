# AI Service Implementation Phases

This folder records the implementation phases for `apps/ai-service`. It is the
progress source of truth for what has already landed and what should be built
next.

## Phase Index

| Phase | Status | Document |
| --- | --- | --- |
| 00 | Done | [Python 3.14 Compatibility](./phase-00-python-314-compatibility.md) |
| 01 | Done | [Package And Nx](./phase-01-package-and-nx.md) |
| 02 | Done | [FastAPI Ops](./phase-02-fastapi-ops.md) |
| 03 | Done | [Shared Proto And gRPC](./phase-03-shared-proto-grpc.md) |
| 04 | Done | [Settings, Metadata, Errors](./phase-04-settings-metadata-errors.md) |
| 05 | Done foundation | [Tools, Providers, RAG, Memory, Workers](./phase-05-tools-providers-rag-memory-workers.md) |
| 06 | Next | [Real Integrations](./phase-06-next-real-integrations.md) |

## Verification Rule

`apps/ai-service` currently has no local test target. Verify AI Service work with:

```sh
npm exec nx show project ai-service --json
npm exec nx run ai-service:proto:generate
npm exec nx lint ai-service
npm exec nx typecheck ai-service
```

Shared proto contracts remain under `libs/contracts`; validate that project
separately when changing proto definitions or TypeScript gRPC constants.

