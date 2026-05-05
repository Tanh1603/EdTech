# BE-4 Course/Class: Course, Class, Membership, Invite

## 1. Objective
Triển khai module course/class và luồng mời học sinh vào lớp qua queue.

## 2. Scope In / Out
### In Scope
- `GET/POST /courses`
- `GET/POST /classes`
- `POST /classes/{classId}/invites`
- Phân quyền teacher/admin theo ownership lớp.

### Out Scope
- Quản lý timetable/lịch học nâng cao.

## 3. API Contract Mapping
- Bám schema `Course`, `Classroom`, paginated responses.
- Invite trả `202` với `jobId`.
- Response vẫn phải theo envelope chuẩn (`success/data/meta/error`) và có `meta.requestId`.

## 3.1 Rule Compliance (must)
- Với invite create endpoint, hỗ trợ `Idempotency-Key` theo `api-response.md`.
- Validation theo `validation.md` cho email list, UUID params, pagination/filter.
- Error mapping theo `error-codes.md` (`VALIDATION_ERROR`, `RESOURCE_NOT_FOUND`, `FORBIDDEN`, `CONFLICT`).
- Logging theo `logging.md`; bắt buộc audit event cho notification bulk dispatch.
- Module/repository layout theo `folder-structure.md`.

## 4. Prisma/DB Changes
- Bảng: `courses`, `classes`, `class_memberships`, `jobs`, `notification_recipients` (nếu gửi notify).
- Unique `(class_id, user_id)`.

## 5. Implementation Steps
1. Tạo `CoursesModule`, `ClassesModule`.
2. Implement CRUD list/create courses/classes theo contract.
3. Implement invite endpoint và enqueue job.
4. Tạo worker stub xử lý invite dispatch.
5. Thêm policy check: teacher chỉ thao tác class của mình.

## 6. Acceptance Criteria
- Tạo lớp/môn thành công.
- Invite trả job hợp lệ và có thể polling status.
- RBAC ownership đúng.
- Retry request cùng `Idempotency-Key` trả lại response trước đó trong TTL.

## 7. Test Cases
### Unit
- Policy check class ownership.
- Invite payload validation.

### Integration
- `POST /classes/{id}/invites` tạo job record.

### E2E
- Teacher tạo class -> mời học sinh -> theo dõi job.

## 8. Deliverables
- Course/Class modules + invite async flow.
