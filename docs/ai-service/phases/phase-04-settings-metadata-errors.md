# Phase 04: Settings, Metadata, Error Model

## Goal

Centralize environment settings, internal request metadata, and gRPC error
mapping.

## Implementation

- Add settings for `AI_GRPC_URL`, `BE_CORE_GRPC_URL`, `SERVICE_TOKEN`,
  `REDIS_URL`, `QDRANT_URL`, `RABBITMQ_URL`, `LLM_PROVIDER`, `LLM_API_KEY`, and
  `EMBEDDING_PROVIDER`.
- Add `apps/ai-service/.env` for local defaults and
  `apps/ai-service/.env.example` as the environment template.
- Include `EMBEDDING_API_KEY` in both env files because the settings model already
  supports separate embedding credentials.
- Parse metadata: `x-request-id`, `x-correlation-id`, `x-user-id`, `x-class-id`,
  `x-ai-job-id`, and `x-service-token`.
- Map service errors to gRPC statuses: invalid input, unauthenticated,
  permission denied, not found, unavailable, deadline exceeded, and internal.

## Acceptance

- Settings have safe local defaults where appropriate.
- `.env` and `.env.example` contain every env var parsed by `Settings`.
- Missing required production config fails clearly.
- Metadata parsing produces a typed request context.
- Error mapping returns predictable gRPC status codes.

## References

- [gRPC Python API](https://grpc.github.io/grpc/python/)
- [OpenTelemetry Python instrumentation](https://opentelemetry.io/docs/languages/python/instrumentation/)
