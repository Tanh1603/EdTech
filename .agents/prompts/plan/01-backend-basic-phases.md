# Backend Basic Features - Coding Phases (NestJS + Prisma)

## Phase BE-1: Core Setup
- Initialize NestJS app, Prisma, PostgreSQL, Redis.
- Global modules: Config, Logger, ExceptionFilter, ValidationPipe.
- Add standard response interceptor (`success/data/meta/error`).
- Output: health endpoint + migration runner + CI lint/test.

## Phase BE-2: API Gateway + Clerk Auth
- Implement Clerk JWT guard (`iss`, `aud`, `exp`, `sub`).
- Implement:
  - `POST /auth/clerk/webhook`
  - `GET /auth/me`
  - `POST /auth/logout`
- Add request-id middleware, CORS, rate-limit.
- Output: auth flow end-to-end.

## Phase BE-3: Users + Admin + RBAC
- Prisma models: users, roles, user_roles.
- Implement:
  - `GET /users/me`
  - `PUT /users/me/learning-profile`
  - `GET/POST /users`
  - `PUT/DELETE /users/{userId}`
- Output: role-safe APIs for student/teacher/admin.

## Phase BE-4: Course/Class Domain
- Prisma models: courses, classes, class_memberships.
- Implement:
  - `GET/POST /courses`
  - `GET/POST /classes`
  - `POST /classes/{classId}/invites`
- Queue invite jobs + email worker stub.
- Output: class lifecycle + invite async job.

## Phase BE-5: Learning Content Domain
- Prisma models: materials, material_chunks.
- Implement:
  - `GET/POST /documents`
  - `PUT/DELETE /documents/{documentId}`
  - `GET /jobs/{jobId}`
- Producer for ingest/index jobs.
- Output: document CRUD + ingest tracking.

## Phase BE-6: Chat Base Domain
- Prisma models: chat_sessions, chat_messages, chat_citations, agent_runs.
- Implement:
  - `GET/POST /chat/sessions`
  - `GET/POST /chat/sessions/{sessionId}/messages`
  - `POST /chat/sessions/{sessionId}/memory/reset`
- AI response mocked in BE.
- Output: stable chat contract for FE integration.

## Phase BE-7: Assessment Base Domain
- Prisma models: exams, exam_versions, questions, submissions, results.
- Implement:
  - `POST /exams/generate`
  - `PUT /exams/{examId}`
  - `POST /exams/{examId}/publish`
  - `POST /exams/{examId}/attempts`
  - `POST /attempts/{attemptId}/submit`
  - `GET /results`
  - `POST /results/{resultId}/override`
- Sync objective grading + enqueue essay grading.
- Output: exam lifecycle chạy end-to-end.

## Phase BE-8: Analytics + Notification Base
- Implement:
  - `GET /analytics/student`
  - `GET /analytics/class/{classId}`
  - `POST /analytics/export`
  - `GET/POST /notifications`
  - `GET /admin/metrics`
  - `GET /admin/agents/monitor`
  - `GET /admin/logs`
- Async export + dispatch jobs.
- Output: dashboards + notifications + admin ops.

## Phase BE-9: Contract Compliance & Hardening
- Add OpenAPI contract tests for all implemented endpoints.
- Add e2e tests per module.
- Add audit logging and error catalog.
- Output: backend release candidate.

## Done Criteria per Phase
- Migration applied successfully.
- Endpoints return standardized envelope.
- RBAC + validation covered by tests.
- Basic observability logs include requestId + latency.
