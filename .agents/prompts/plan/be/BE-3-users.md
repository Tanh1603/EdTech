# BE-3 Users: User + Admin + RBAC

## 1. Objective
Triển khai domain user và admin user management kèm RBAC 3 role.

## 2. Scope In / Out
### In Scope
- `GET /users/me`
- `PUT /users/me/learning-profile`
- `GET /users`
- `POST /users`
- `PUT /users/{userId}`
- `DELETE /users/{userId}`
- RBAC cho student/teacher/admin.

### Out Scope
- Permissions matrix chi tiết theo trường hợp đặc biệt ngoài contract.

## 3. API Contract Mapping
- Bám schema `User`, `LearningProfile`, `AdminCreateUserRequest`, `AdminUpdateUserRequest`.
- Pagination chuẩn cho `GET /users`.
- Bắt buộc envelope response + `meta.requestId`; `meta.pagination` chỉ cho list API.

## 3.1 Rule Compliance (must)
- Validation theo `validation.md`: trim, length, email RFC, UUID params, enum reject invalid.
- Validation lỗi phải map `VALIDATION_ERROR` với `details` theo field.
- Error mapping khác theo `error-codes.md` (`RESOURCE_NOT_FOUND`, `CONFLICT`, `FORBIDDEN`).
- Logging theo `logging.md`; bắt buộc audit event cho user/role update.
- Cấu trúc module theo `folder-structure.md`; controller không gọi Prisma trực tiếp.

## 4. Prisma/DB Changes
- Bảng: `users`, `roles`, `user_roles`, `learning_profiles`.
- Ràng buộc unique: `users.external_user_id`, `users.email`.

## 5. Implementation Steps
1. Tạo `UsersModule`, `AdminUsersModule`.
2. Tạo `RolesGuard` + decorator `@Roles(...)`.
3. Implement profile endpoints cho user.
4. Implement admin CRUD user + role binding.
5. Thêm soft-delete hoặc status inactive theo contract.
6. Chuẩn hóa filter/pagination list users.

## 6. Acceptance Criteria
- Role kiểm soát đúng quyền endpoint.
- CRUD user hoạt động đúng schema.
- Envelope response + error mapping đúng chuẩn.
- `GET /users` pagination tuân thủ `1 <= limit <= 100`, `page >= 1`.

## 7. Test Cases
### Unit
- RolesGuard cho 3 role.
- DTO validation cho create/update user.

### Integration
- `GET /users` chỉ admin truy cập.
- `PUT /users/me/learning-profile` chỉ cập nhật user hiện tại.

### E2E
- End-to-end admin user lifecycle.

## 8. Deliverables
- Users/Admin module + RBAC nền tảng.
