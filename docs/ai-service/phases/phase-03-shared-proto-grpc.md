# Phase 03: Shared Proto And gRPC

## Goal

Generate and use Python gRPC modules from the existing shared proto library
instead of creating duplicate AI service contracts.

## Status

Done foundation. Codegen reads `libs/contracts/proto`, emits Python modules into
`apps/ai-service/src/ai_service/contracts/generated`, and the gRPC server has
placeholder service registration for AI methods.

## Related Modules

- `apps/ai-service/src/ai_service/contracts/generate_proto.py`
- `apps/ai-service/src/ai_service/contracts/generated`
- `apps/ai-service/src/ai_service/grpc/server.py`
- `apps/ai-service/src/ai_service/grpc/services.py`

## Lib Dependencies

Source of truth:

- `libs/contracts/proto/ai/orchestrator.proto`
- `libs/contracts/proto/ai/jobs.proto`
- `libs/contracts/proto/ai/rag.proto`
- Shared imports under `libs/contracts/proto/common` and domain folders.

## Verify

```sh
npm exec nx run ai-service:proto:generate
npm exec nx typecheck ai-service
```

## Next Step

Replace deterministic placeholder handlers with production handlers while
keeping request/response shapes aligned to the shared proto files.

