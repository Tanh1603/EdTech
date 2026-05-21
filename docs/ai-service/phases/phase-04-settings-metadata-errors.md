# Phase 04: Settings, Metadata, Errors

## Goal

Centralize runtime settings, internal metadata parsing, and gRPC error mapping.

## Status

Done foundation. Settings include AI, BE Core, Redis, Qdrant, RabbitMQ, LLM, and
embedding provider configuration. Metadata parsing handles request, correlation,
user, class, job, and service token fields.

## Related Modules

- `apps/ai-service/src/ai_service/config/settings.py`
- `apps/ai-service/src/ai_service/grpc/metadata.py`
- `apps/ai-service/src/ai_service/grpc/errors.py`
- `apps/ai-service/src/ai_service/grpc/interceptors.py`

## Lib Dependencies

Metadata carries IDs that reference BE Core domain state. AI Service should load
domain data through BE Core gRPC contracts, not direct database reads.

## Verify

```sh
npm exec nx lint ai-service
npm exec nx typecheck ai-service
```

## Next Step

Add real auth/service-token enforcement once BE Core client wiring and deployment
configuration are stable.

