# EdTech Test Plan

Version: `v1`

Sources:

- `docs/api-contract/gateway.md` is the current public API contract.
- `docs/api-contract/*.md` are supporting domain notes.
- `docs/flow/*.puml` define business flows.
- `docs/system-architechture.md` and `docs/architecture-scan.md` define service ownership and current implementation status.

## 1. Test Objectives

The test plan covers API Gateway, BE Core, shared contracts, and current end-to-end user flows. The current production-facing contract is API Gateway at `/api`; therefore, blackbox, integration, and E2E tests should primarily enter through `apps/api-gateway`. BE Core tests remain important for whitebox/domain behavior because BE Core is the source of truth for authorization, persistence, and business invariants.

Primary goals:

- Verify all public routes follow the Gateway response envelope.
- Verify Clerk bearer authentication and role/ownership authorization.
- Verify Gateway-to-BE Core gRPC translation and gRPC error-to-HTTP mapping.
- Verify module workflows across Academic, Learning, Assessment, Chat, Storage, Users, Jobs, and Notifications.
- Verify async/job-facing flows return `jobId` or queryable job state where required.
- Prepare future test slots for AI Service, RAG, grading, and adaptive flows, while marking missing AI runtime as phase-later scope.

## 2. Test Locations

| Test type | Recommended project/location | Purpose |
| --- | --- | --- |
| Unit test | `apps/api-gateway/src/**/*.spec.ts`, `apps/backend/src/**/*.spec.ts`, `libs/contracts/src/**/*.spec.ts` | Pure functions, DTO validation, mappers, guards, interceptors, filters |
| Whitebox module test | `apps/backend/src/modules/**/__tests__` or colocated `*.spec.ts` | Service-level business rules with mocked Prisma/gRPC dependencies |
| Gateway integration test | `apps/api-gateway/src/**/*.integration.spec.ts` | Controller + guard + mocked gRPC clients |
| Contract test | `libs/contracts/src/**/*.spec.ts`, `libs/contracts/proto/**/*.proto` coverage tests | DTO/proto/package/method consistency |
| Blackbox API test | `apps/api-gateway-e2e/src/api-gateway/**/*.spec.ts` | Public HTTP behavior only, no internal knowledge |
| E2E flow test | `apps/api-gateway-e2e/src/flows/**/*.spec.ts` | Multi-step user journeys through Gateway |
| Backend compatibility E2E | `apps/backend-e2e` | Dev/migration REST compatibility only, lower priority than Gateway |

Run through Nx:

```txt
npm exec nx test api-gateway
npm exec nx test backend
npm exec nx test contracts
npm exec nx e2e api-gateway-e2e
```

## 3. Common Test Requirements

These checks apply to every module unless explicitly excluded:

- Success envelope: `success=true`, `data` present, `error=null`, `meta.requestId`, `meta.timestamp`.
- Error envelope: `success=false`, `data=null`, `error.code`, `error.message`, request metadata preserved.
- Pagination: list endpoints return `meta.pagination` with `page`, `limit`, `total`, `totalPages`.
- Auth: missing token returns `401`; invalid token returns `401`; valid token forwards user metadata.
- Authorization: wrong role or non-owner returns `403`.
- Validation: malformed UUID/body/query returns `400`.
- Not found: missing resources return `404`.
- Conflict: duplicate resources return `409` where domain requires uniqueness.
- gRPC mapping: `INVALID_ARGUMENT -> 400`, `UNAUTHENTICATED -> 401`, `PERMISSION_DENIED -> 403`, `NOT_FOUND -> 404`, `ALREADY_EXISTS -> 409`, `FAILED_PRECONDITION -> 412`, `RESOURCE_EXHAUSTED -> 429`, `INTERNAL -> 500`.
- Observability: every request has a request ID and Gateway forwards it to BE Core metadata.
- Security: no internal service token, stack trace, provider secret, or private gRPC detail leaks to clients.

## 4. Blackbox Test Plan

Blackbox tests use only the public Gateway contract. They should live in `apps/api-gateway-e2e` and call HTTP endpoints under `/api`.

### Gateway/Public Contract

| Area | Test cases |
| --- | --- |
| Swagger | `GET /api/docs` is reachable in allowed environments and describes Gateway routes |
| Envelope | every success and error response has the standard shape |
| Auth boundary | protected endpoints reject missing/invalid bearer token |
| Request metadata | response has stable `requestId` and ISO timestamp |
| Error mapping | mocked downstream failures produce expected HTTP status and error code |
| Unknown route | returns Gateway-shaped `404`, not default framework HTML/text |

### Academic

| Flow | Test cases |
| --- | --- |
| Course CRUD | create, list with pagination/search, detail, patch, delete |
| Course authorization | student cannot create/update/delete; teacher can manage own courses only |
| Classroom CRUD | create classroom for course, list by course, update schedule/name, delete |
| Invite code | regenerate invite code, old code rejected after regeneration |
| Enrollment | student joins by invite code, teacher manually enrolls student, duplicate enrollment returns conflict |
| Lessons | create course lesson, list by course, update, delete |
| Classroom lessons | publish lesson to classroom, prevent duplicate publish, unpublish/update, remove |
| Validation | invalid UUIDs, short names, invalid date range, non-positive `orderNo` |

### Learning

| Flow | Test cases |
| --- | --- |
| Storage upload | `POST /api/storage/upload` accepts multipart `file`, rejects missing/oversized/unsupported files |
| Material metadata | create material after upload using JSON only, reject raw file bytes to `/api/learning/materials` |
| Material lifecycle | list/filter by lesson/status, detail, update title, delete |
| Chunks | list chunks with pagination, get chunk detail, handle missing chunk |
| Roadmaps | create roadmap, list by status, detail, update status/title, delete |
| Roadmap items | add item, update item, complete, uncomplete, delete, progress summary |
| Next item | `GET /api/learning/roadmaps/next` returns the next actionable item or empty state |
| Mastery | view own mastery, class mastery for teacher, topic history, analytics, risk students |
| Mastery writes | system-only upsert/bulk upsert rejects normal users |

### Assessment

| Flow | Test cases |
| --- | --- |
| Exam CRUD | create draft, list/filter by class/status/search, detail, update, delete |
| Exam lifecycle | publish draft, close published exam, reject invalid state transitions |
| Questions | add question, list, detail, update, delete, reorder |
| Question validation | invalid type, empty prompt, invalid options/answer key, non-positive points/order |
| Student attempt | start published exam, reject draft/closed exam, prevent duplicate active submission |
| Autosave | patch answers, partial answers are persisted and retrievable |
| Submit | submit answers, status changes to submitted, duplicate submit rejected |
| Results | student views own result, teacher manual grades, analytics by exam/question/student |
| Authorization | student cannot manage exams/questions/manual-grade; teacher cannot view unrelated class data |

### Chat

| Flow | Test cases |
| --- | --- |
| Session lifecycle | create session, list own sessions, detail, rename, delete |
| Messages | list messages with pagination/cursor, send message, get message detail, delete |
| AI response | message send returns user message and assistant message where AI path is enabled |
| Context scope | user cannot access another user's session/message |
| Classroom scope | classroom analytics only available to authorized teacher |
| Validation | empty content, invalid session ID, long title, invalid pagination |

### Users, Jobs, Notifications

| Module | Test cases |
| --- | --- |
| Users | `GET /api/users` filters/paginates and enforces admin/teacher scope as implemented |
| Jobs | `GET /api/jobs/:jobId` returns pending/running/completed/failed and rejects missing job |
| Notifications | create notification returns job when dispatch is async, list notifications, unread count, mark one read, mark all read |
| Notification auth | users only see own notifications; teacher/admin audience rules enforced |

## 5. Whitebox Test Plan

Whitebox tests inspect internal services, guards, mappers, and domain rules. They should mock external dependencies unless the behavior under test is specifically integration.

### API Gateway Whitebox

| Component | Test cases |
| --- | --- |
| `ResponseEnvelopeInterceptor` | wraps success, omits pagination when absent, preserves request ID |
| `GatewayErrorFilter` | converts gRPC/framework errors into public envelope |
| `grpc-status.mapper` | maps every supported gRPC code to HTTP status and public error code |
| `GatewayAuthGuard` | validates bearer token, attaches user context, rejects missing/invalid token |
| `grpc-metadata.builder` | forwards `authorization`, `x-request-id`, `x-correlation-id`, `x-user-id`, optional class ID |
| Gateway controllers | call correct gRPC client method with DTO/query/path params |
| Storage service | validates file presence, invokes Cloudinary provider, maps provider failures safely |

### BE Core Whitebox

| Module | Test cases |
| --- | --- |
| Academic services | ownership checks, unique invite code, unique enrollment, lesson publish uniqueness, date/order validation |
| Learning services | material status transitions, metadata-only material creation, roadmap progress calculation, mastery score bounds |
| Assessment services | exam state machine, question reorder transaction, submission uniqueness, autosave merge/replace policy, score bounds |
| Chat services | session ownership, message persistence order, delete behavior, analytics aggregation |
| Notifications | audience resolution, unread counters, read/read-all idempotency, async job creation |
| Jobs | job state transition rules, retry/failure metadata, not-found behavior |

### Contracts Whitebox

| Area | Test cases |
| --- | --- |
| DTO validation | required fields, enum values, UUID fields, pagination transforms |
| Proto path helpers | all proto files are discoverable through `@edtech/contracts` helpers |
| gRPC constants | package/service/method names match proto definitions |
| Mappers | date, page, JSON struct, enum, and envelope mappers handle null/empty values |

## 6. Integration Test Plan

Integration tests verify boundaries between components. Use real Nest testing modules where feasible and mock only expensive/remote infrastructure.

| Boundary | Test cases |
| --- | --- |
| Gateway controller -> mocked BE gRPC | every public route calls the correct gRPC service/method and maps response |
| Gateway auth -> metadata -> gRPC | bearer token and request context are propagated |
| Gateway error filter -> HTTP response | downstream gRPC errors become correct public envelope |
| Gateway storage -> Cloudinary mock | multipart upload returns `storageUrl`, `publicId`, `mimeType`, `size` |
| BE service -> Prisma test DB | transactions, unique constraints, soft delete filters, pagination totals |
| BE -> RabbitMQ/job publisher mock | material ingest, notifications, grading jobs are enqueued and job records created |
| Contracts -> Gateway/BE clients | proto loader can load all active packages and services |

Recommended integration infrastructure by phase:

- Phase 1: mocked gRPC clients and mocked external providers.
- Phase 2: Testcontainers or docker-compose PostgreSQL for BE Core persistence tests.
- Phase 3: RabbitMQ/Redis integration for async jobs and rate limits.
- Phase 4: AI Service stubs for chat, grading, material ingestion, and roadmap generation.

## 7. E2E Flow Test Plan

E2E tests should be placed in `apps/api-gateway-e2e`. They should execute realistic user flows through Gateway. Prefer seeded test users with roles `student`, `teacher`, and `admin`.

### Flow 1: Teacher Course/Class/Lesson Setup

1. Teacher creates a course.
2. Teacher creates a classroom for that course.
3. Teacher creates reusable lessons in the course.
4. Teacher publishes one lesson to the classroom.
5. Student joins classroom by invite code.
6. Student lists published classroom lessons.
7. Assert student cannot see unpublished/removed lessons.

### Flow 2: Material Upload and RAG Readiness

1. Teacher uploads a file through `/api/storage/upload`.
2. Teacher creates material metadata through `/api/learning/materials`.
3. API returns material with status `uploaded` or `indexing`.
4. Job status is queryable through `/api/jobs/:jobId` if ingestion is async.
5. After worker/stub marks ready, material detail returns `ready` and chunks are listable.

Until AI ingestion exists, use worker stubs or BE test fixtures for chunk readiness.

### Flow 3: Exam Lifecycle

1. Teacher creates exam for classroom.
2. Teacher adds/reorders questions.
3. Teacher publishes exam.
4. Student starts exam.
5. Student autosaves answers.
6. Student submits exam.
7. Teacher manually grades or AI-grading stub creates result.
8. Student views own result.
9. Teacher views exam analytics.

### Flow 4: Chat Tutor Session

1. Student creates chat session.
2. Student sends message.
3. Gateway persists user message through BE Core.
4. AI response is returned or stubbed assistant message is appended.
5. Student lists message history.
6. Another user cannot read the session or messages.

### Flow 5: Roadmap and Mastery

1. Student creates or receives a roadmap.
2. Student adds/receives roadmap items.
3. Student completes an item.
4. Progress endpoint reflects new percentage.
5. Mastery is updated by system/stub.
6. Teacher views class mastery and risk students.

### Flow 6: Notifications

1. Teacher creates notification for class.
2. API returns notification or dispatch job.
3. Student lists notifications.
4. Student checks unread count.
5. Student marks one notification read.
6. Student marks all read.

### Flow 7: Gateway Failure and Recovery

1. Simulate BE Core unavailable.
2. Gateway returns controlled error envelope, not raw connection error.
3. Simulate downstream deadline/timeout.
4. Gateway returns expected timeout status/code.
5. Request ID is still present for every failure.

## 8. Module Test Phases

### Phase 0: Test Harness and Contract Baseline

Scope:

- Replace placeholder Gateway E2E smoke test with real `/api/docs`, envelope, auth, and error tests.
- Add test token/user fixtures.
- Add gRPC client mocks for Gateway E2E where BE Core is not required.
- Add reusable API test helpers in `apps/api-gateway-e2e/src/support`.
- Add contract tests for proto path loading and method constants.

Exit criteria:

- `npm exec nx test contracts` passes.
- `npm exec nx test api-gateway` passes.
- `npm exec nx e2e api-gateway-e2e` covers Gateway health/docs/auth/envelope.

### Phase 1: Academic Module

Scope:

- Blackbox and E2E through API Gateway for courses, classes, lessons, enrollments.
- Whitebox service tests for ownership, uniqueness, validation, and publish logic.
- Integration tests for Gateway controller-to-gRPC mapping.

Priority:

1. Course CRUD.
2. Classroom CRUD and invite code.
3. Enrollment.
4. Lessons and classroom lessons.

Exit criteria:

- Teacher/student role matrix is covered.
- Duplicate enrollment and duplicate classroom lesson publish are covered.
- Course/class/lesson list pagination is covered.

### Phase 2: Learning and Storage

Scope:

- Storage upload at Gateway.
- Material metadata CRUD and chunk reads.
- Roadmaps/items/progress.
- Mastery read/write authorization.
- Async material ingestion contract through jobs.

Priority:

1. Upload + create material metadata.
2. Material status/chunk visibility.
3. Roadmap progress.
4. Mastery/risk-students.

Exit criteria:

- Raw file bytes are rejected from `/api/learning/materials`.
- Material async status is testable with stubbed job/worker.
- System-only mastery writes are protected.

### Phase 3: Assessment

Scope:

- Exam/question CRUD.
- Exam state transitions.
- Student start/autosave/submit.
- Results/manual grade/analytics.
- AI grading job contract as stub until AI Service exists.

Priority:

1. Draft-to-published-to-closed lifecycle.
2. Question management and reorder.
3. Student attempt flow.
4. Grading/result analytics.

Exit criteria:

- Invalid exam transitions are covered.
- Student cannot start draft/closed exam.
- Duplicate submission and score bounds are covered.

### Phase 4: Chat

Scope:

- Session/message CRUD.
- AI assistant response with stubbed AI path.
- Ownership isolation.
- Classroom analytics authorization.

Priority:

1. Session lifecycle.
2. Message send/history.
3. Cross-user access denial.
4. AI response/job/streaming contract where implemented.

Exit criteria:

- Chat session/message ownership is covered.
- Empty content and invalid session IDs are covered.
- AI response path can be tested deterministically with a stub.

### Phase 5: Notifications, Jobs, Users, Cross-Cutting

Scope:

- Notifications and unread counts.
- Jobs status endpoint.
- Users list/filter authorization.
- Rate limit, timeout, request size, CORS, and error leakage checks.

Exit criteria:

- Async notification creation exposes job or dispatch state.
- Job not-found/failure/success are covered.
- Security regression tests exist for public Gateway boundaries.

### Phase 6: AI Service and Agent Runtime

Current status from `architecture-scan.md`: `apps/ai-service` exists but is empty; orchestrator, planner, reasoner, tool selector, MCP server, memory, Qdrant, Redis, and LLM provider adapter are missing.

Scope when implemented:

- AI Service health and gRPC contract tests.
- Material ingestion worker integration with storage, BE internal gRPC, and vector DB.
- RAG retrieval quality smoke tests with deterministic fixture documents.
- Chat response tests with mocked LLM provider.
- Assessment grading tests with rubric fixtures and deterministic provider stub.
- Roadmap/adaptive learning generation tests.
- Token budget/rate limit tests.

Exit criteria:

- AI workflows have deterministic stub mode in CI.
- Provider secrets are never required for normal CI.
- RAG tests assert citations reference known chunks.

## 9. Regression Matrix

| Change area | Required tests |
| --- | --- |
| DTO/proto contract | contracts unit, Gateway controller integration, affected E2E route |
| Gateway auth/error/envelope | all common Gateway unit tests, one E2E success and one E2E failure per affected module |
| Academic service | related whitebox tests, Academic E2E flow |
| Learning/materials | storage/material E2E, job contract tests, material status tests |
| Assessment | exam lifecycle E2E, submission/result tests, state machine unit tests |
| Chat | session/message E2E, ownership tests, AI stub test |
| Jobs/notifications | async job tests, retry/failure tests, unread-count tests |
| Prisma schema | affected service integration tests with test DB, migration smoke test |

## 10. Recommended Test Data

Use deterministic fixtures:

- Users: `teacher_a`, `teacher_b`, `student_a`, `student_b`, `admin_a`.
- Course: `Mathematics Grade 12`.
- Classroom: `Math 12A1`.
- Lessons: `Derivatives`, `Integrals`.
- Material: small PDF/text fixture, `application/pdf` and `text/plain`.
- Exam: `Calculus Midterm`, 3 questions covering single choice, true/false, short answer.
- Chat session: `Calculus Support`.
- Roadmap: `Calculus Recovery Plan`.

Fixture rules:

- Every fixture should be isolated by test run ID.
- Do not depend on real Clerk, Cloudinary, LLM provider, RabbitMQ, or Qdrant in default CI.
- Use provider stubs for blackbox/E2E unless an environment explicitly opts into external integration.

## 11. Definition of Done

A module is test-complete for the current phase when:

- Public Gateway contract tests cover success, validation, auth, authorization, not found, and conflict paths.
- Whitebox tests cover core domain invariants.
- Integration tests cover Gateway-to-gRPC mapping.
- At least one E2E user flow covers the module's main business path.
- Test data is deterministic and cleanly isolated.
- Tests run through Nx using the repository package manager.
- Known gaps are documented with phase and reason.

