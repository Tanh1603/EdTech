# Phase 03: gRPC AI Server Bootstrap

## Goal

Bootstrap the internal gRPC server from shared proto contracts in
`libs/contracts/proto/ai`.

## Implementation

- Generate Python stubs into `src/ai_service/contracts/generated`.
- Source proto files from `libs/contracts/proto`; do not duplicate proto files
  inside `apps/ai-service`.
- Create gRPC runtime modules for server bootstrap, metadata parsing, and
  interceptors.
- Implement deterministic placeholder service handlers for
  `AiOrchestratorService`, `AiJobsService`, and `AiRagService`.

## Acceptance

- gRPC server can boot.
- Generated Python modules import successfully.
- Placeholder methods return deterministic responses.
- Shared contract changes are picked up by `proto:generate`.

## References

- [gRPC Python quickstart](https://grpc.io/docs/languages/python/quickstart/)
- [gRPC Python basics](https://grpc.io/docs/languages/python/basics/)
- [Protocol Buffers proto3 specification](https://protobuf.dev/reference/protobuf/proto3-spec/)

