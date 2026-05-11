# E2E Clerk Auth Setup

## Goal

The default E2E suite only validates public contract, Swagger route coverage, auth boundary, and response envelope behavior. Full flow tests are opt-in because they need real Clerk JWTs, BE Core, gRPC, database seed data, and sometimes existing class/lesson/exam IDs.

This document explains how to fetch Clerk session JWTs for the E2E users.

## Required Environment Variables

```txt
CLERK_SECRET_KEY=sk_test_...

E2E_TEACHER_A_USER_ID=user_...
E2E_TEACHER_B_USER_ID=user_...
E2E_STUDENT_A_USER_ID=user_...
E2E_STUDENT_B_USER_ID=user_...
E2E_ADMIN_A_USER_ID=user_...

E2E_CLASS_ID=...
E2E_LESSON_ID=...
E2E_EXAM_ID=...
```

Generated token variables:

```txt
E2E_TEACHER_A_TOKEN=...
E2E_TEACHER_B_TOKEN=...
E2E_STUDENT_A_TOKEN=...
E2E_STUDENT_B_TOKEN=...
E2E_ADMIN_A_TOKEN=...
```

## Automatic E2E Token Bootstrap

`api-gateway-e2e` automatically tries to fetch Clerk JWTs during Jest global setup when:

- `CLERK_SECRET_KEY` is set.
- One or more `E2E_*_USER_ID` variables are set.
- The matching `E2E_*_TOKEN` variable is not already set.

Example:

```txt
$env:CLERK_SECRET_KEY='sk_test_...'
$env:E2E_TEACHER_A_USER_ID='user_...'
$env:E2E_STUDENT_A_USER_ID='user_...'
$env:RUN_ACADEMIC_CRUD_E2E='true'
node node_modules\nx\bin\nx.js run api-gateway-e2e:e2e --skip-nx-cache
```

With the sample user names from the project:

```txt
$env:E2E_STUDENT_A_USER_ID=$env:USER1_ID
$env:E2E_STUDENT_B_USER_ID=$env:USER2_ID
$env:E2E_TEACHER_A_USER_ID=$env:TEACHER1_ID
```

The flow specs call `createApiClientForUser(userId)`, which internally calls `getJwtTokenForUserId(userId)` and attaches the JWT as `Authorization: Bearer <token>`.

Disable automatic token bootstrap when needed:

```txt
$env:CLERK_E2E_AUTO_TOKENS='false'
```

## Manual Script

Use the repository script:

```txt
node scripts/e2e-clerk-tokens.mjs
```

It prints PowerShell assignments that can be copied into the current terminal session. This is useful when you want to inspect or reuse tokens manually instead of letting E2E setup fetch them.

## Run Opt-In Flows

```txt
$env:RUN_ACADEMIC_CRUD_E2E='true'
$env:RUN_LEARNING_STORAGE_E2E='true'
$env:RUN_ASSESSMENT_E2E='true'
$env:RUN_CHAT_E2E='true'
$env:RUN_SUPPORT_MODULES_E2E='true'
node node_modules\nx\bin\nx.js run api-gateway-e2e:e2e --skip-nx-cache
```

## Clerk API Notes

Current Clerk SDK docs recommend:

- `clerkClient.sessions.getSessionList({ userId })` to list sessions for a user.
- `clerkClient.sessions.getToken(sessionId, template?)` to retrieve/generate a session JWT.

The Backend API endpoint behind `getToken()` is currently documented as:

```txt
POST /sessions/{session_id}/tokens/{template_name}
```

If no custom JWT template is used, prefer the SDK script above instead of hand-writing REST calls.

## Postman Variant

If using Postman manually:

1. Use Clerk secret key as bearer auth when calling Clerk Backend API.
2. List sessions by user ID.
3. Select an active session ID.
4. Generate a token for that session.
5. Save `response.jwt` into the matching `E2E_*_TOKEN` variable.

Example test script after token generation:

```js
const response = pm.response.json();
const token = response.jwt;
pm.environment.set('E2E_STUDENT_A_TOKEN', token);
console.log('Token saved:', token);
```

Avoid committing Clerk secret keys, JWTs, or Postman environment exports.
