# Phase 6: Cross-Cutting Hardening

## Goal

Add tests that cut across all modules and protect Gateway behavior, security, observability, and resilience.

## Scope

- Response envelope consistency.
- gRPC error mapping.
- Auth and authorization boundaries.
- Request ID/correlation propagation.
- Rate limiting and request size limits.
- Timeout and downstream outage behavior.
- Swagger/public contract drift.
- CI regression grouping.

## Implementation Tasks

1. Add shared Gateway blackbox tests for every response shape.
2. Add route table tests that compare implemented Gateway routes against `docs/api-contract/gateway.md` or generated Swagger snapshots.
3. Add gRPC status mapping tests for every mapped status.
4. Add downstream failure tests for BE Core unavailable and deadline exceeded.
5. Add request ID propagation tests with mocked gRPC metadata.
6. Add security tests that assert no stack traces, service tokens, provider secrets, or raw gRPC details leak.
7. Add optional rate-limit tests once Redis-backed limiter is enabled.
8. Add CI target grouping by module.

## Suggested Files

```txt
apps/api-gateway-e2e/src/cross-cutting/envelope.e2e-spec.ts
apps/api-gateway-e2e/src/cross-cutting/auth.e2e-spec.ts
apps/api-gateway-e2e/src/cross-cutting/downstream-failure.e2e-spec.ts
apps/api-gateway-e2e/src/cross-cutting/swagger-contract.e2e-spec.ts
apps/api-gateway/src/modules/common/error-mapping/*.spec.ts
apps/api-gateway/src/modules/common/grpc-metadata/*.spec.ts
apps/api-gateway/src/modules/common/request-context/*.spec.ts
```

## Test Cases

| Area | Cases |
| --- | --- |
| Envelope | success, validation error, auth error, forbidden, not found, conflict, internal error |
| gRPC mapping | every supported gRPC status maps to expected HTTP code and public error |
| Request ID | generated when missing, preserved when supplied if policy allows, forwarded to gRPC |
| Auth | missing bearer, malformed bearer, expired token, valid role token |
| Timeout | downstream timeout returns controlled public error |
| Outage | BE Core unavailable returns controlled public error |
| Security | no stack trace/internal token/raw service URL in public response |
| Swagger | Gateway docs include expected public route groups |

## CI Grouping

Recommended module targets:

```txt
npm exec nx test contracts
npm exec nx test api-gateway
npm exec nx test backend
npm exec nx e2e api-gateway-e2e -- --runInBand
```

If E2E grows too slow, split by Jest path:

```txt
npm exec nx e2e api-gateway-e2e -- --testPathPattern=academic
npm exec nx e2e api-gateway-e2e -- --testPathPattern=learning
npm exec nx e2e api-gateway-e2e -- --testPathPattern=assessments
npm exec nx e2e api-gateway-e2e -- --testPathPattern=chat
```

## Done Criteria

- All modules share the same envelope/auth/error expectations.
- Gateway failures are deterministic and safe.
- Contract drift can be detected before release.
- CI can run module-level tests independently.

