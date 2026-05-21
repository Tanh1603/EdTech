# Phase 02: FastAPI Ops

## Goal

Expose only internal operational HTTP endpoints for the AI Service process.

## Status

Done. The app has health, readiness, and metrics routes and no public AI REST
surface.

## Related Modules

- `apps/ai-service/src/ai_service/main.py`
- `apps/ai-service/src/ai_service/api/health.py`
- `apps/ai-service/src/ai_service/api/readiness.py`
- `apps/ai-service/src/ai_service/api/metrics.py`

## Lib Dependencies

The ops API does not own domain DTOs. Domain traffic should still flow through
BE Core and shared gRPC contracts.

## Verify

```sh
npm exec nx serve ai-service
```

Then check `/health`, `/ready`, and `/metrics` from the local host/port.

## Next Step

Wire readiness to real dependencies only after BE Core, Redis, Qdrant, and
RabbitMQ adapters exist.

