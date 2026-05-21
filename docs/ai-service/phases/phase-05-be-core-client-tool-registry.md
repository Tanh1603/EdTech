# Phase 05: Real BE Core Client And Tool Registry

## Goal

Create the real BE Core gRPC client boundary and typed local tool registry that
the orchestrator and workers use for all domain reads/writes.

AI Service must not read or write LMS database tables directly. Materials, chat,
jobs, and storage operations go through BE Core gRPC contracts generated from
`libs/contracts/proto`.

## Implementation

- Use `ai_service/agents/clients/BeCoreGrpcClient` with
  `grpc.insecure_channel(settings.be_core_grpc_url)` for local/internal calls.
- Load generated Python protobuf modules only after calling
  `ensure_generated_proto_path()`.
- Initialize real stubs for `LearningMaterialsService`, `JobsService`,
  `ChatSessionsService`, `ChatMessagesService`, and `StorageService`.
- Convert Python dictionaries to/from `google.protobuf.Struct` for BE Core
  `ObjectResponse`, `PageResponse`, and request body/payload fields.
- Forward `x-service-token` on every BE Core call.
- Forward delegated user metadata for user-scoped tools: `x-user-id`,
  `x-user-roles`, `x-user-permissions`, `x-request-id`, `x-correlation-id`, and
  `x-ai-job-id`.
- Reject user-scoped tools without `user_id` using `UNAUTHENTICATED`.
- Register real tools only: `materials.get`, `materials.chunks`,
  `materials.chunk`, `chat.messages`, `chat.append_assistant`, `jobs.create`,
  `jobs.status`, `jobs.running`, `jobs.succeeded`, `jobs.failed`, and
  `storage.delete`.
- Do not use MCP in V1; keep the typed local tool contract so MCP can wrap the
  same tools later.

## Acceptance

- No `FakeBeCoreClient` or placeholder tool responses remain in phase 05 code.
- Tool calls execute BE Core gRPC stubs, not local dictionaries.
- Audit events include `toolName`, `requestId`, `correlationId`, and `jobId`.
- Service-only job methods work with `SERVICE_TOKEN`.
- Material, chat, storage, and user-visible job status tools require delegated
  user metadata compatible with BE Core guards.

## References

- [gRPC Python quickstart](https://grpc.io/docs/languages/python/quickstart/)
- [Protocol Buffers Struct](https://protobuf.dev/reference/protobuf/google.protobuf/#struct)
- [Model Context Protocol specification](https://modelcontextprotocol.io/specification/latest)
- [Toolformer paper](https://arxiv.org/abs/2302.04761)
- [ReAct paper](https://arxiv.org/abs/2210.03629)
