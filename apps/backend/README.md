# Branch Backend Skeleton

This folder contains a NestJS + Prisma backend scaffold generated from `.agents/prompts/plan/be` and aligned with `.agents/prompts/rules`.

## Implemented Scope (BE-1..BE-9 scaffold)

- BE-1 Core:
  - Global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`)
  - `ResponseEnvelopeInterceptor` with `success/data/meta/error`
  - `GlobalExceptionFilter` with standard error code mapping
  - `RequestIdMiddleware`
  - `GET /api/health`
- BE-2 Auth:
  - `POST /api/auth/clerk/webhook`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
- BE-3 Users + RBAC:
  - `GET /api/users/me`
  - `PUT /api/users/me/learning-profile`
  - `GET /api/users` (role-restricted via `@Roles('admin')`)
- BE-4 + BE-5 Learning domain:
  - `GET/POST /api/courses`
  - `GET/POST /api/classes`
  - `POST /api/classes/:classId/invites`
  - `GET/POST /api/documents`
  - `PUT /api/documents/:documentId`
  - `GET /api/jobs/:jobId`
- BE-6 Chat:
  - `GET/POST /api/chat/sessions`
  - `GET/POST /api/chat/sessions/:sessionId/messages`
  - `POST /api/chat/sessions/:sessionId/memory/reset`
- BE-7 Assessment:
  - `POST /api/exams/generate`
  - `PUT /api/exams/:examId`
  - `POST /api/exams/:examId/publish`
  - `POST /api/exams/:examId/attempts`
  - `POST /api/attempts/:attemptId/submit`
  - `GET /api/results`
  - `POST /api/results/:resultId/override`
- BE-8 Analytics + Admin:
  - `GET /api/analytics/student`
  - `GET /api/analytics/class/:classId`
  - `POST /api/analytics/export`
  - `GET/POST /api/notifications`
  - `GET /api/admin/metrics`
  - `GET /api/admin/agents/monitor`
  - `GET /api/admin/logs`
- BE-9 Hardening baseline:
  - Consistent envelope and error mapping in place
  - Initial Prisma schema in `prisma/schema.prisma`

## Notes

- Current implementation is scaffold-level (service logic is stubbed).
- To finish production-ready BE-9, add repositories with Prisma queries, workers/queues, and e2e/contract tests.

