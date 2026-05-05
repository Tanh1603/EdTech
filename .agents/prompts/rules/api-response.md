# API Response Rules

## Envelope Chuẩn
Mọi API backend phải trả về theo format:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-05-05T10:00:00Z",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  },
  "error": null
}
```

## Quy tắc
- `success=true` khi xử lý thành công.
- `data=null` cho lỗi hoặc endpoint không có payload.
- `meta.requestId` bắt buộc cho mọi response.
- `meta.pagination` chỉ xuất hiện ở list APIs.
- `error` luôn là object khi `success=false`.

## Status Code
- `200`: read/update thành công.
- `201`: create thành công.
- `202`: async accepted (trả `jobId`).
- `204`: no-content.
- `4xx/5xx`: theo `error-codes.md`.

## Async Pattern
- Endpoint async phải trả:
  - `success=true`
  - `data.jobId`
  - polling qua `GET /jobs/{jobId}`.

## Idempotency
- Với endpoint create dễ bị retry (invite, notification dispatch), hỗ trợ `Idempotency-Key` header.
- Khi nhận key trùng trong TTL: trả lại response cũ.
