# Phase 0: Test Harness

## Goal

Prepare shared testing utilities so later module tests are small, consistent, and deterministic.

## Scope

- Public Gateway blackbox helpers.
- Auth fixtures for teacher, student, admin, and unauthorized users.
- Response envelope matchers.
- gRPC client mocks.
- Seed/test data naming conventions.
- Contract smoke tests for proto discovery.

## Implementation Tasks

1. Create API Gateway E2E support helpers in `apps/api-gateway-e2e/src/support`.
2. Add a test HTTP client wrapper that sets base URL `/api`, bearer token, request ID, and common headers.
3. Add auth fixture helpers:
   - `teacherA`
   - `teacherB`
   - `studentA`
   - `studentB`
   - `adminA`
4. Add Jest matchers or helper assertions:
   - `expectSuccessEnvelope(response)`
   - `expectErrorEnvelope(response, status, code)`
   - `expectPagination(response)`
5. Add Gateway unit mocks for BE Core gRPC clients.
6. Add contract tests that load every proto path from `@edtech/contracts`.
7. Replace placeholder `GET /api` smoke test with real Gateway contract smoke tests.

## Suggested Files

```txt
apps/api-gateway-e2e/src/support/api-client.ts
apps/api-gateway-e2e/src/support/auth-fixtures.ts
apps/api-gateway-e2e/src/support/envelope-assertions.ts
apps/api-gateway-e2e/src/api-gateway/gateway-contract.spec.ts
apps/api-gateway/src/modules/grpc-clients/__mocks__/be-core-grpc-client.mock.ts
libs/contracts/src/grpc/proto-contract.spec.ts
```

## Test Cases

| Type | Cases |
| --- | --- |
| Blackbox | `GET /api/docs`, unknown route, protected route without token |
| Unit | envelope assertion helpers, gRPC status mapper, proto path helpers |
| Integration | Gateway controller receives mocked gRPC success/error and returns envelope |

## Done Criteria

- Later tests can create authenticated requests without repeating boilerplate.
- Gateway success/error envelope checks are reusable.
- Contract tests fail when proto paths/constants drift.
- Placeholder E2E test is removed or replaced.

