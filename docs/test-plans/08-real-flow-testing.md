# Real Flow Testing With Axios or Postman

## Purpose

These tests are for real microservice flow testing:

```txt
Tester -> API Gateway HTTP -> BE Core gRPC -> Database / Queue / Storage
```

They are different from default CI tests. Default CI only checks public route contract, auth boundary, Swagger, and mocked/unit behavior. Real flow testing requires running services and real Clerk JWTs.

## Required Services

Start the infrastructure and services first:

```txt
docker compose up -d postgres redis rabbitmq
node node_modules\nx\bin\nx.js run backend:serve
node node_modules\nx\bin\nx.js run api-gateway:serve
```

Use external Gateway mode when running E2E against already-running services:

```txt
$env:API_GATEWAY_E2E_EXTERNAL_SERVER='true'
$env:HOST='localhost'
$env:PORT='8080'
```

## Required Variables

```txt
API_BASE_URL=http://localhost:8080/api
CLERK_SECRET_KEY=sk_test_...

TEACHER1_ID=user_3Da1r4qpBmJOOnK1gb6UGneHSRb
USER1_ID=user_3Da1k90Lr822gW1H91NGKUOGKXg
USER2_ID=user_3Da1nLNH0o4OCeNiZhCLeFLtrBB
```

Optional seeded IDs for flows that depend on existing data:

```txt
E2E_CLASS_ID=...
E2E_LESSON_ID=...
E2E_EXAM_ID=...
```

## Clerk Token Flow

The Axios and Postman flows use this Clerk sequence:

1. Create a session for a user:

```txt
POST https://api.clerk.com/v1/sessions
Authorization: Bearer {{CLERK_SECRET_KEY}}
Content-Type: application/json

{
  "user_id": "{{USER_ID}}"
}
```

2. Create a JWT from the session:

```txt
POST https://api.clerk.com/v1/sessions/{{SESSION_ID}}/tokens
Authorization: Bearer {{CLERK_SECRET_KEY}}
Content-Type: application/json

{
  "expires_in_seconds": 604800
}
```

3. Use `response.jwt` as:

```txt
Authorization: Bearer {{JWT_TOKEN}}
```

## Axios Script

Run all implemented real flows:

```txt
$env:API_BASE_URL='http://localhost:8080/api'
$env:CLERK_SECRET_KEY='sk_test_...'
$env:TEACHER1_ID='user_3Da1r4qpBmJOOnK1gb6UGneHSRb'
$env:USER1_ID='user_3Da1k90Lr822gW1H91NGKUOGKXg'
$env:USER2_ID='user_3Da1nLNH0o4OCeNiZhCLeFLtrBB'
node scripts\real-flow-test.mjs
```

Run one flow:

```txt
$env:FLOW='academic'
node scripts\real-flow-test.mjs
```

Supported `FLOW` values:

```txt
smoke
academic
learning
assessment
chat
notifications
all
```

## Postman

Import:

```txt
postman/EdTech Real Flow Tests.postman_collection.json
```

Set collection variables:

```txt
apiBaseUrl=http://localhost:8080/api
clerkSecretKey=sk_test_...
teacherUserId=user_3Da1r4qpBmJOOnK1gb6UGneHSRb
studentUserId=user_3Da1k90Lr822gW1H91NGKUOGKXg
otherStudentUserId=user_3Da1nLNH0o4OCeNiZhCLeFLtrBB
```

Run folders in this order:

1. `00 Clerk Tokens`
2. `01 Smoke`
3. `02 Academic Full Flow`
4. `03 Learning Storage Full Flow`
5. `04 Assessment Full Flow`
6. `05 Chat Full Flow`
7. `06 Notifications Jobs Users Full Flow`
8. `07 Future Runtime Missing Coverage`

Every request logs failures to Postman Console with:

- step name
- HTTP method and URL
- status code
- request body
- response body
- Gateway `requestId`, `error.code`, and `error.message`
- current flow state such as `courseId`, `classroomId`, `lessonId`, `examId`, `submissionId`, `sessionId`, `notificationId`, and `jobId`

The notification create step stores:

```txt
notificationId = data.notificationIds[0] || data.id
jobId = data.jobId
```

This matches the current create-notification behavior where the API creates notification records immediately and also returns a dispatch job.

## Flow Coverage

| Flow | What it validates |
| --- | --- |
| Smoke | Swagger, missing-auth failure, authenticated `/courses`, unknown route error shape |
| Academic | Course/class/lesson CRUD reads, invite regeneration, publish/unpublish, join, duplicate conflict, manual enrollment |
| Learning | Optional storage upload, material metadata CRUD reads, chunks, roadmap/item/progress, mastery/risk endpoints |
| Assessment | Exam CRUD reads, question CRUD/reorder, draft start rejection, publish/start/autosave/submit/manual-grade/result/analytics/close |
| Chat | Session lifecycle, message lifecycle, empty message validation, cross-user isolation, analytics |
| Notifications | User and class notification creation, `notificationIds[0]` capture, unread/list/read-one/read-all, jobs, users auth check |
| Future Coverage | Documents user stories blocked by missing runtime: AI orchestrator, RAG citations, placement, proctoring, dashboards, export, admin metrics |

## Expected Failure Causes

| Symptom | Likely cause |
| --- | --- |
| Clerk returns no session | User ID is wrong or Clerk project does not allow session creation this way |
| `401` from Gateway | JWT was not created from the same Clerk project as Gateway `CLERK_SECRET_KEY` |
| `14 UNAVAILABLE` / `500` | API Gateway cannot reach BE Core gRPC |
| `404` resource in later flow step | Seed IDs are missing or previous create step failed |
| Upload/material flow fails | Storage/Cloudinary or BE material module not configured |
