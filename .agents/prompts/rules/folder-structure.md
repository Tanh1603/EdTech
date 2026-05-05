# Folder Structure Rules (NestJS Backend Core)

## Root Layout
- `src/common` -> interceptors, filters, guards, decorators, utils
- `src/modules` -> domain modules
- `src/config` -> env/config providers
- `prisma` -> schema, migrations, seed
- `test` -> e2e/integration setup

## Module Layout Convention
Mỗi module theo cấu trúc:
- `controllers/`
- `services/`
- `repositories/`
- `dto/`
- `mappers/`
- `spec/`

Riêng `auth` module cần thêm:
- `strategies/` (vd: `clerk-jwt.strategy.ts`)
- `guards/` (vd: `clerk-auth.guard.ts`)
- `decorators/` (vd: `current-user.decorator.ts`)

## Naming Rules
- File: `kebab-case`.
- Class: `PascalCase`.
- DTO suffix: `*.dto.ts`.
- Controller suffix: `*.controller.ts`.
- Service suffix: `*.service.ts`.

## Dependency Rules
- Controller không gọi Prisma trực tiếp.
- Service không phụ thuộc module UI/transport.
- Repository chỉ chứa DB query logic.
- Cross-module access qua service interface rõ ràng.
- Auth context phải đi qua Passport guard + `@CurrentUser()` decorator, không parse JWT thủ công trong controller.

## Test Layout
- Unit test gần source (`*.spec.ts`).
- E2E test trong `test/e2e`.
- Contract tests trong `test/contract`.
