# EdTech Backend

This backend is an internal gRPC-only NestJS service. Public HTTP, WebSocket,
SSE, Swagger, CORS, and Clerk webhook traffic are handled by `apps/api-gateway`.

## Runtime Surface

- gRPC listens on `BACKEND_GRPC_URL`.
- Gateway-to-backend calls require `x-service-token`.
- User-scoped gRPC calls also require forwarded Clerk bearer metadata.
- Backend verifies the Clerk token subject, then loads roles and permissions from
  the local RBAC tables.

## RBAC

- `users` stores Clerk user profiles.
- `roles`, `permissions`, `user_roles`, and `role_permissions` are the source of
  truth for authorization.
- Clerk webhook sync is exposed at `POST /api/webhooks/clerk` in API Gateway.
- New `user.created` webhook users receive the default `student` role.
- Backend syncs a compact RBAC snapshot to Clerk `privateMetadata.sys.rbac`.
- Configure Clerk Dashboard webhooks to send `user.created`, `user.updated`, and
  `user.deleted` events to API Gateway:
  - local tunnel/dev: `https://<tunnel>/api/webhooks/clerk`
  - deployed gateway: `https://<gateway-domain>/api/webhooks/clerk`
- Configure the Clerk session token custom claim so runtime auth can read the
  snapshot without querying the DB on every request:

```json
{
  "sys": "{{user.private_metadata.sys}}"
}
```

For local RBAC repair or reseeding, run the idempotent SQL in
`apps/backend/prisma/seeds/rbac.sql` against the backend database. The same seed
statements are also included in a Prisma migration so `prisma migrate deploy`
keeps deployed environments seeded.
