# BE-1 Core: Foundation Setup

## 1. Objective
Thiết lập nền tảng backend core bằng NestJS + Prisma + PostgreSQL + Redis theo hướng contract-first, sẵn sàng cho các phase tiếp theo.

## 2. Scope In / Out
### In Scope
- Bootstrap NestJS app và cấu trúc module base.
- Cấu hình Prisma, PostgreSQL, Redis, BullMQ cơ bản.
- Global middleware/pipeline: ValidationPipe, Exception Filter, Response Interceptor, Request ID.
- Thiết lập lint/test scripts và health endpoint.

### Out Scope
- Business endpoint chi tiết theo domain.
- AI integration.

## 3. API Contract Mapping
- `GET /health` (internal) để kiểm tra runtime.
- Chuẩn response cho mọi endpoint phải theo envelope từ `docs/api-contract.yml`:
  - `success`, `data`, `meta`, `error`.
- Bắt buộc có `meta.requestId`; chỉ list API mới có `meta.pagination`.

## 3.1 Rule Compliance (must)
- Tuân thủ `.agents/prompts/rules/folder-structure.md` cho layout module và naming.
- Tuân thủ `.agents/prompts/rules/error-codes.md` cho mapping lỗi; không trả stacktrace ra client.
- Tuân thủ `.agents/prompts/rules/validation.md` với global ValidationPipe:
  - `whitelist=true`
  - `forbidNonWhitelisted=true`
  - `transform=true`
- Tuân thủ `.agents/prompts/rules/logging.md` cho required fields + PII masking.

## 4. Prisma/DB Changes
- Khởi tạo `schema.prisma` và kết nối DB.
- Chưa bắt buộc đầy đủ domain table, chỉ cần smoke model + migration pipeline hoạt động.
- Đảm bảo migration command chạy ổn định trong local/dev.

## 5. Implementation Steps
1. Tạo app NestJS và cấu hình module `AppModule`.
2. Cấu hình `.env` cho DB/Redis/Clerk placeholders.
3. Khởi tạo Prisma client + migration baseline.
4. Thêm global `ValidationPipe` và `ClassSerializerInterceptor` (nếu dùng).
5. Thêm custom `ResponseEnvelopeInterceptor`.
6. Thêm `GlobalExceptionFilter` trả format lỗi chuẩn.
7. Thêm middleware `RequestIdMiddleware`.
8. Thêm `GET /health`.
9. Cấu hình scripts: `lint`, `test`, `test:e2e`, `prisma:migrate`.

## 6. Acceptance Criteria
- App chạy local thành công.
- Kết nối DB và Redis thành công.
- Endpoint health trả response đúng envelope.
- Lỗi validation/runtime trả format lỗi chuẩn.
- Module skeleton theo đúng folder structure rules.
- Log có đủ `requestId`, `route`, `method`, `latencyMs`, `statusCode`.

## 7. Test Cases
### Unit
- Interceptor trả đúng structure envelope.
- Exception filter map đúng error code cơ bản.

### Integration
- `GET /health` trả `200` và có `requestId`.

### E2E
- Boot app + health check + DB ping.

## 8. Deliverables
- NestJS core skeleton.
- Prisma baseline migration.
- Bộ middleware/interceptor/filter global.
