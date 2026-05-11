# Phase 5: Notifications, Jobs, and Users

## Goal

Implement tests for supporting modules that are used across flows: notifications, jobs, and users.

## Public Contract Source

- `docs/api-contract/gateway.md`
- `docs/flow/notification.puml`
- `docs/flow/analytics.puml`

## Implementation Order

1. Jobs status endpoint.
2. Notifications lifecycle.
3. Notification async dispatch contract.
4. Users list/filter authorization.
5. Cross-module job references from learning/assessment/notifications.

## API Gateway E2E Files

```txt
apps/api-gateway-e2e/src/jobs/jobs.e2e-spec.ts
apps/api-gateway-e2e/src/notifications/notifications.e2e-spec.ts
apps/api-gateway-e2e/src/users/users.e2e-spec.ts
apps/api-gateway-e2e/src/flows/notification-dispatch.e2e-spec.ts
```

## Gateway Unit/Integration Files

```txt
apps/api-gateway/src/modules/jobs/*.spec.ts
apps/api-gateway/src/modules/notifications/*.spec.ts
apps/api-gateway/src/modules/users/*.spec.ts
```

## Backend Whitebox Files

```txt
apps/backend/src/modules/jobs/*.spec.ts
apps/backend/src/modules/notifications/*.spec.ts
apps/backend/src/modules/users/*.spec.ts
```

## Blackbox Cases

| Area | Cases |
| --- | --- |
| Jobs | get pending, running, completed, failed, not-found job |
| Job auth | users cannot see jobs outside their scope |
| Notifications | create, list, unread count, mark one read, mark all read |
| Dispatch | manual/batch notification returns job when recipient resolution is async |
| Notification scope | student sees own notifications only |
| Users | list users with pagination/filter/query |
| Users auth | unauthorized role cannot list users if endpoint is restricted |

## Whitebox Cases

| Service rule | Cases |
| --- | --- |
| Job state | valid transitions and invalid transition rejection |
| Job metadata | failure reason, retry count, timestamps are persisted |
| Notification audience | resolves class/user audiences correctly |
| Unread count | idempotent read/read-all operations |
| Dispatch enqueue | creates job and publishes queue message once |
| Users query | role/search pagination maps to correct Prisma query |

## E2E Flow

1. Teacher creates notification for a classroom.
2. API returns notification or dispatch job.
3. Student lists notifications.
4. Student checks unread count.
5. Student marks one notification read.
6. Student marks all read.
7. Teacher/admin checks job status if dispatch was async.

## Done Criteria

- Job status endpoint is covered for all important states.
- Notification read/unread behavior is idempotent.
- User list/filter access rules are covered.

