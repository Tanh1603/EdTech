# BE-2 Auth: Clerk-first Gateway

## 1. Objective
Triển khai auth layer hoàn chỉnh theo Clerk-first qua API Gateway, dùng Passport trong NestJS để verify JWT và chuẩn hóa current user context cho toàn hệ thống.

## 2. Scope In / Out
### In Scope
- `POST /auth/clerk/webhook`
- `GET /auth/me`
- `POST /auth/logout`
- Passport strategy + guard cho Clerk JWT.
- `@CurrentUser()` decorator để lấy user hiện tại trong controller/service boundary.
- CORS, rate limit, request-id, logging cho auth flow.

### Out Scope
- Local username/password login.
- OAuth provider custom ngoài Clerk.

## 3. API Contract Mapping
- Bám `docs/api-contract.yml` cho 3 endpoint auth.
- Webhook endpoint public nhưng phải verify signature header.
- Response envelope theo `api-response.md`; lỗi map theo `error-codes.md`.
- Chuẩn `GET /auth/me` trả `AuthMeResponse` gồm:
  - `data.user` (domain user)
  - `data.auth.externalUserId` (Clerk `sub`)
  - `data.auth.issuer`, `data.auth.audience`

## 3.1 Rule Compliance (must)
- Auth DTO/params phải validate theo `validation.md` (email/enum/UUID nếu có).
- Logging auth flow theo `logging.md`, đặc biệt không log raw authorization header/token.
- Bắt buộc audit event cho auth failures bất thường.
- Cấu trúc module/file theo `folder-structure.md`.

## 4. Prisma/DB Changes
- Sử dụng bảng `users` (map `external_user_id`).
- Không lưu password nội bộ.
- Upsert user khi nhận webhook `user.created|updated|deleted`.

## 5. Implementation Steps
1. Tạo `AuthModule` + `PassportModule`.
2. Implement `ClerkJwtStrategy` (extends PassportStrategy):
   - parse Bearer token
   - verify `iss/aud/exp/sub`
   - reject token invalid/expired.
3. Implement `ClerkAuthGuard` dựa trên Passport strategy.
4. Tạo `CurrentUser` type (id, externalUserId, email, roles, status) và `@CurrentUser()` decorator.
5. Implement auth context builder:
   - map JWT `sub` -> `users.external_user_id`
   - nếu chưa có user record: upsert/lazy-create theo policy.
6. Implement `GET /auth/me` trả `AuthMeResponse` đúng envelope.
7. Implement `POST /auth/clerk/webhook`:
   - verify signature
   - xử lý `user.created|updated|deleted`
   - upsert/deactivate user.
8. Implement `POST /auth/logout`:
   - stateless JWT: clear session hints/cache (nếu có)
   - trả `204`.
9. Gắn rate limit + audit logging + request-id cho toàn bộ auth endpoints.

## 6. Acceptance Criteria
- Token Clerk hợp lệ truy cập được endpoint bảo vệ.
- Passport strategy/guard được dùng thống nhất cho endpoint protected.
- `@CurrentUser()` trả đúng context user sau auth guard.
- Webhook hợp lệ cập nhật user record.
- Response đúng envelope format.
- Unauthorized/forbidden map đúng mã lỗi chuẩn (`UNAUTHORIZED`, `FORBIDDEN`).

## 7. Test Cases
### Unit
- Passport strategy pass/fail theo claims `iss/aud/exp/sub`.
- `@CurrentUser()` decorator extract đúng principal.
- Webhook signature verifier pass/fail.

### Integration
- `GET /auth/me` với token hợp lệ trả `200`.
- `GET /auth/me` với token không hợp lệ trả `401` + error code chuẩn.
- Webhook `user.updated` cập nhật DB.
- User chưa tồn tại nhưng token hợp lệ: tạo/mapping theo policy và trả được current user.

### E2E
- Authenticated request flow qua gateway.

## 8. Deliverables
- Auth module hoàn chỉnh Clerk + Passport + CurrentUser.
- Webhook sync pipeline.
