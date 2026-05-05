# Logging Rules

## Required Fields
Mỗi log entry tối thiểu cần có:
- `timestamp`
- `level`
- `service`
- `requestId`
- `route`
- `method`
- `actorUserId` (nếu có)
- `latencyMs`
- `statusCode`

## Log Levels
- `debug`: chi tiết kỹ thuật dev.
- `info`: business flow bình thường.
- `warn`: hành vi bất thường có thể recover.
- `error`: lỗi cần can thiệp.

## Privacy & Security
- Mask PII nhạy cảm: token, password, webhook secret.
- Không log raw authorization headers.
- Chỉ log payload theo allowlist fields.

## Audit Events (bắt buộc)
- User/role update.
- Score override.
- Notification bulk dispatch.
- Auth failures (suspicious pattern).
