# Error Codes Rules

## Format
```json
{
  "code": "RESOURCE_NOT_FOUND",
  "message": "Class not found",
  "details": ["classId=..."]
}
```

## Nhóm mã lỗi chuẩn
- `VALIDATION_ERROR` -> `400`
- `UNAUTHORIZED` -> `401`
- `FORBIDDEN` -> `403`
- `RESOURCE_NOT_FOUND` -> `404`
- `CONFLICT` -> `409`
- `RATE_LIMITED` -> `429`
- `INTERNAL_ERROR` -> `500`
- `DEPENDENCY_ERROR` -> `502/503`

## Quy tắc mapping
- Không expose stacktrace cho client.
- `message` ngắn, dễ hiểu.
- `details` chỉ chứa thông tin cần thiết để debug API consumer.

## Domain-specific examples
- Auth: `CLERK_TOKEN_INVALID`, `CLERK_WEBHOOK_SIGNATURE_INVALID`
- Users: `ROLE_INVALID`, `USER_ALREADY_EXISTS`
- Classes: `CLASS_INVITE_INVALID_EMAIL`
- Jobs: `JOB_NOT_FOUND`, `JOB_STATE_INVALID`
