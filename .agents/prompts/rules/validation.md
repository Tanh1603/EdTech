# Validation Rules

## DTO Validation
- Dùng `class-validator` + `class-transformer`.
- Bật global validation:
  - `whitelist=true`
  - `forbidNonWhitelisted=true`
  - `transform=true`

## Input Guards
- String fields: trim + length constraints.
- Email fields: chuẩn RFC format.
- UUID params: validate trước khi vào service.
- Enum fields: reject nếu không thuộc enum.

## Pagination/Filtering
- `page >= 1`
- `1 <= limit <= 100`
- sanitize `q` filter tránh injection patterns.

## Error Output
- Validation fail luôn map về `VALIDATION_ERROR`.
- Trả danh sách `details` theo từng field lỗi.
