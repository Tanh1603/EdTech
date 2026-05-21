# Architecture Scan Against `docs/architechture.webp`

Scan date: 2026-05-10.

This report compares the current repository with the SuA Agent architecture diagram.

## Summary

The current codebase is aligned with the right-side "Org System (Current)" and the public ingress direction:

- API Gateway exists and is the public HTTP ingress.
- API Gateway calls BE Core through gRPC + Protobuf.
- BE Core owns domain persistence and exposes compatibility REST plus internal gRPC facades.
- Shared contracts are centralized in `libs/contracts`.
- Storage upload is implemented at Gateway/Cloudinary and metadata is persisted in BE Core.

The current codebase is not yet aligned with the left-side "SuA Agent" runtime:

- `apps/ai-service/` has an initial Python 3.14 foundation: package structure,
  FastAPI ops endpoints, Nx targets, gRPC/codegen helpers, real Groq/Ollama
  providers, typed tools, RAG primitives, memory, workers, and orchestrator.
- AI gRPC contracts exist under `libs/contracts/proto/ai`, but no AI gRPC server
  implements them yet.
- Planner, reasoner, tool selector, MCP server, Redis, Qdrant, and production
  memory interfaces are still missing.

## Component Matrix

| Diagram Component | Expected Architecture | Current Code | Status |
| --- | --- | --- | --- |
| End User -> Internet -> Org Gateway | Client enters through Gateway | `apps/api-gateway` exists with HTTP routes and Swagger | Partial |
| Gateway public API | REST/SSE/WebSocket public edge | REST HTTP routes implemented; SSE/WebSocket AI streaming not implemented | Partial |
| Gateway -> BE Core | gRPC + Protobuf | Implemented through `BeCoreGrpcClientService` and `libs/contracts/proto` | Aligned |
| BE Core | Domain system of record | `apps/backend` with academic, assessments, chat, learning, storage, users | Aligned |
| BE Core REST | Compatibility/dev only | REST controllers still exist and are Clerk-protected | Aligned for migration |
| BE Core gRPC | Internal service API | gRPC facades exist for current modules | Aligned |
| Storage | Object storage/provider SDK | Cloudinary integration exists | Aligned |
| Shared contracts | Central contract ownership | `libs/contracts` owns DTOs, proto, gRPC constants, mappers | Aligned |
| SuA Agent service | Separate AI runtime | `apps/ai-service` has the initial Python package/runtime foundation and real Groq/Ollama provider adapters | Partial |
| Orchestrator | Execution loop + agent state | Lightweight execution loop foundation exists | Partial |
| Planner | Plan generation | Not implemented | Missing |
| Reasoner | Reason over task/context | Not implemented | Missing |
| Tool selector | Choose tools and policies | Not implemented | Missing |
| MCP server | Tool registry/protocol | Not implemented | Missing |
| LLM server/provider | Provider abstraction and streaming | Groq SDK provider exists; self-hosted LLM server is not implemented | Partial |
| Memory interface | Redis/session memory + retrieval memory | In-memory session foundation exists; Redis is missing | Partial |
| Interactive memory | Current session state | In-memory session foundation exists | Partial |
| System/User prompts | Versioned prompt registry | Not implemented | Missing |
| Business domain policy | AI policy prompt/config | Not implemented | Missing |
| Tool-calling prompt | Tool schemas and call prompts | Not implemented | Missing |
| Vector DB | Qdrant gRPC | Not implemented | Missing |
| Event/job bus | RabbitMQ + DB `jobs` | BE Core foundation exists for job status and RabbitMQ dispatch; AI consumers are not implemented | Partial |

## Current Project Evidence

Implemented:

```txt
apps/api-gateway
apps/backend
libs/contracts
libs/contracts/proto
```

Implemented foundation or missing:

```txt
apps/ai-service        # foundation package exists
libs/contracts/proto/ai # contracts exist, server implementation missing
Redis/Qdrant integration code
AI worker code
MCP server code
LLM provider code      # Groq SDK foundation exists
```

## Alignment Decision

The repository is currently in "Gateway + BE Core foundation complete" state, not full SuA Agent state.

The next architecture milestone should be:

1. Run Python 3.14 compatibility verification with `uv sync`, tests, and proto generation.
2. Implement real AI gRPC handlers from `libs/contracts/proto/ai`.
3. Add BE Core/Gateway clients where needed.
4. Replace fake workers with RabbitMQ consumers that update BE Core job status.
5. Add Qdrant/Redis integrations.
6. Expand material ingestion first because BE Core already has `Material` and `MaterialChunk` models.

Detailed AI Service target architecture is documented in `docs/ai-service/architecture.md`.
