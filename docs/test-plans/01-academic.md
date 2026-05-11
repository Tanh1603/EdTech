# Phase 1: Academic Module

## Goal

Implement tests for courses, classrooms, enrollments, lessons, and classroom lessons through API Gateway, with backend whitebox coverage for domain rules.

## Public Contract Source

- `docs/api-contract/gateway.md`
- `docs/api-contract/academic.md`
- `docs/flow/auth.puml`

## Implementation Order

1. Course CRUD.
2. Classroom CRUD and invite code.
3. Enrollment join/manual add/remove.
4. Lesson CRUD.
5. Publish lesson to classroom.
6. Full teacher/student setup E2E flow.

## API Gateway E2E Files

```txt
apps/api-gateway-e2e/src/academic/courses.e2e-spec.ts
apps/api-gateway-e2e/src/academic/classrooms.e2e-spec.ts
apps/api-gateway-e2e/src/academic/enrollments.e2e-spec.ts
apps/api-gateway-e2e/src/academic/lessons.e2e-spec.ts
apps/api-gateway-e2e/src/flows/academic-classroom-setup.e2e-spec.ts
```

## Gateway Unit/Integration Files

```txt
apps/api-gateway/src/modules/academic/*.spec.ts
apps/api-gateway/src/modules/academic/*.integration.spec.ts
```

## Backend Whitebox Files

```txt
apps/backend/src/modules/academic/courses/*.spec.ts
apps/backend/src/modules/academic/classrooms/*.spec.ts
apps/backend/src/modules/academic/enrollments/*.spec.ts
apps/backend/src/modules/academic/lessons/*.spec.ts
```

## Blackbox Cases

| Area | Cases |
| --- | --- |
| Courses | create, list pagination/search, detail, patch, delete |
| Course auth | student cannot create; teacher cannot update/delete another teacher's course |
| Classrooms | create, list by course, detail, patch, delete |
| Invite code | regenerate code, new code works, old code fails |
| Enrollments | join by invite, manual add, duplicate enrollment returns conflict, remove enrollment |
| Lessons | create, list by course, detail, patch, delete |
| Classroom lessons | publish, duplicate publish conflict, unpublish, remove |
| Validation | invalid UUID, name under minimum, `startAt >= endAt`, non-positive `orderNo` |

## Whitebox Cases

| Service rule | Cases |
| --- | --- |
| Ownership | only course/class owner can mutate resources |
| Invite code | generated code is unique and rotated atomically |
| Enrollment | unique `(classId, userId)` enforced |
| Lesson order | `orderNo` is positive and list order is deterministic |
| Publish lesson | lesson belongs to the classroom course or rejects when cross-course publish is invalid |
| Soft delete | deleted resources are hidden from list/detail where applicable |

## E2E Flow

1. Teacher creates course.
2. Teacher creates classroom.
3. Teacher creates two lessons.
4. Teacher publishes one lesson to classroom.
5. Student joins classroom by invite code.
6. Student lists classroom lessons.
7. Student sees only published lesson.
8. Teacher unpublishes/removes lesson.
9. Student no longer sees removed lesson.

## Done Criteria

- All Academic public endpoints from Gateway contract have at least one success test.
- Main validation, auth, not-found, and conflict paths are covered.
- Full Academic flow passes through `api-gateway-e2e`.

