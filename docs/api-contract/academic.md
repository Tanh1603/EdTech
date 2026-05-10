# Academic Module API Contract

Version: `v1`  
Base URL:

```txt
/api
```

Public client contract is exposed by API Gateway Swagger at `GET /api/docs`.

---

# Standard Response Format

## Success Response

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-05-07T10:00:00.000Z"
  },
  "error": null
}
```

---

## Error Response

```json
{
  "success": false,
  "data": null,
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-05-07T10:00:00.000Z"
  },
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Course not found"
  }
}
```

---

# Module Structure

```txt
modules/
└── academic/
    ├── courses/
    ├── classrooms/
    ├── enrollments/
    └── lessons/
```

---

# Domain Overview

## Course

Course là chương trình học tổng quát.

Ví dụ:
- Mathematics Grade 12
- English Communication
- Physics Advanced

Một Course:
- có nhiều Lesson
- có nhiều Classroom

---

## Classroom

Classroom là lớp học thực tế của Course.

Ví dụ:
- Math 12A1
- Math Evening Class
- Math Summer 2026

Một Classroom:
- có học sinh riêng
- có lịch học riêng
- có Lesson được publish riêng

---

## Lesson

Lesson là nội dung học reusable thuộc Course.

Ví dụ:
- Derivatives
- Integrals
- Probability

Lesson không phụ thuộc trực tiếp Classroom.

Classroom muốn sử dụng Lesson phải publish qua bảng:
- ClassroomLesson

---

# Prisma Models

---

# Course

```prisma
model Course {
  id           String      @id @default(dbgenerated("gen_random_uuid()"))
  teacherId    String      @map("teacher_id")

  name         String
  description  String?
  thumbnailUrl String?     @map("thumbnail_url")

  createdAt    DateTime    @default(now()) @map("created_at")
  updatedAt    DateTime    @updatedAt

  classrooms   Classroom[]
  lessons      Lesson[]

  @@map("courses")
}
```

---

# Classroom

```prisma
model Classroom {
  id         String    @id @default(dbgenerated("gen_random_uuid()"))
  courseId   String    @map("course_id") @db.Uuid

  name       String
  inviteCode String    @unique @map("invite_code")

  startAt    DateTime? @map("start_at")
  endAt      DateTime? @map("end_at")

  createdAt  DateTime  @default(now()) @map("created_at")

  course           Course            @relation(fields: [courseId], references: [id])

  enrollments      Enrollment[]
  exams            Exam[]
  chatSessions     ChatSession[]
  classroomLessons ClassroomLesson[]

  @@map("classrooms")
}
```

---

# Enrollment

```prisma
model Enrollment {
  id        String    @id @default(dbgenerated("gen_random_uuid()"))

  classId   String    @map("class_id") @db.Uuid
  userId    String    @map("user_id")

  role      ClassRole @default(student)

  joinedAt  DateTime  @default(now())

  classroom Classroom @relation(fields: [classId], references: [id])

  @@unique([classId, userId])
  @@map("enrollments")
}
```

---

# Lesson

```prisma
model Lesson {
  id               String            @id @default(dbgenerated("gen_random_uuid()"))

  courseId         String            @map("course_id") @db.Uuid

  title            String
  description      String?

  orderNo          Int               @map("order_no")

  createdAt        DateTime          @default(now()) @map("created_at")
  updatedAt        DateTime          @updatedAt @map("updated_at")

  course           Course            @relation(fields: [courseId], references: [id])

  materials        Material[]
  classroomLessons ClassroomLesson[]

  @@index([courseId, orderNo])
  @@map("lessons")
}
```

---

# ClassroomLesson

```prisma
model ClassroomLesson {
  id          String   @id @default(dbgenerated("gen_random_uuid()"))

  classId     String   @map("class_id") @db.Uuid
  lessonId    String   @map("lesson_id") @db.Uuid

  isPublished Boolean  @default(true) @map("is_published")

  publishedAt DateTime? @map("published_at")

  createdAt   DateTime @default(now()) @map("created_at")

  classroom Classroom @relation(fields: [classId], references: [id])
  lesson    Lesson    @relation(fields: [lessonId], references: [id])

  @@unique([classId, lessonId])
  @@map("classroom_lessons")
}
```

---

# Courses APIs

---

# Create Course

## POST `/courses`

## Authorization

Teacher only

---

## Request Body

```json
{
  "teacherId": "teacher_123",
  "name": "Mathematics Grade 12",
  "description": "Advanced calculus course",
  "thumbnailUrl": "https://cdn.example.com/math.png"
}
```

---

## Response

```json
{
  "success": true,
  "data": {
    "id": "course_uuid",
    "teacherId": "teacher_123",
    "name": "Mathematics Grade 12",
    "description": "Advanced calculus course",
    "thumbnailUrl": "https://cdn.example.com/math.png",
    "createdAt": "2026-05-07T10:00:00.000Z"
  }
}
```

---

# Get Courses

## GET `/courses`

---

## Query Params

| Param | Type | Description |
|---|---|---|
| page | number | Current page |
| limit | number | Items per page |
| search | string | Search by course name |
| teacherId | string | Filter by teacher |

---

## Example

```txt
GET /courses?page=1&limit=10&search=math
```

---

# Get Course Detail

## GET `/courses/:courseId`

---

# Update Course

## PATCH `/courses/:courseId`

---

## Request Body

```json
{
  "name": "Mathematics Updated",
  "description": "Updated course"
}
```

---

# Delete Course

## DELETE `/courses/:courseId`

Soft delete recommended.

---

# Classroom APIs

---

# Create Classroom

## POST `/classes`

## Authorization

Teacher only

---

## Request Body

```json
{
  "courseId": "course_uuid",
  "name": "Math 12A1",
  "startAt": "2026-06-01T00:00:00.000Z",
  "endAt": "2027-01-01T00:00:00.000Z"
}
```

---

## Response

```json
{
  "success": true,
  "data": {
    "id": "class_uuid",
    "courseId": "course_uuid",
    "name": "Math 12A1",
    "inviteCode": "ABC123"
  }
}
```

---

# Get Classrooms

## GET `/classes`

---

## Query Params

| Param | Type |
|---|---|
| page | number |
| limit | number |
| courseId | uuid |

---

# Get Classroom Detail

## GET `/classes/:classroomId`

---

# Update Classroom

## PATCH `/classes/:classroomId`

---

## Request Body

```json
{
  "name": "Math 12A2"
}
```

---

# Delete Classroom

## DELETE `/classes/:classroomId`

---

# Regenerate Invite Code

## POST `/classes/:classroomId/regenerate-invite-code`

---

## Response

```json
{
  "success": true,
  "data": {
    "inviteCode": "NEWCODE123"
  }
}
```

---

# Enrollment APIs

---

# Join Classroom By Invite Code

## POST `/enrollments/join`

---

## Request Body

```json
{
  "inviteCode": "ABC123"
}
```

---

# Add Student To Classroom

## POST `/enrollments`

Teacher manually add student.

---

## Request Body

```json
{
  "classId": "class_uuid",
  "userId": "user_123",
  "role": "student"
}
```

---

# Get Classroom Students

## GET `/classrooms/:classroomId/students`

---

## Response

```json
{
  "success": true,
  "data": [
    {
      "userId": "user_123",
      "role": "student",
      "joinedAt": "2026-05-07T10:00:00.000Z"
    }
  ]
}
```

---

# Update Enrollment Role

## PATCH `/enrollments/:enrollmentId`

---

## Request Body

```json
{
  "role": "teacher"
}
```

---

# Remove Student From Classroom

## DELETE `/enrollments/:enrollmentId`

---

# Lesson APIs

---

# Create Lesson

## POST `/lessons`

---

## Authorization

Teacher only

---

## Request Body

```json
{
  "courseId": "course_uuid",
  "title": "Derivatives",
  "description": "Introduction to derivatives",
  "orderNo": 1
}
```

---

## Response

```json
{
  "success": true,
  "data": {
    "id": "lesson_uuid",
    "courseId": "course_uuid",
    "title": "Derivatives",
    "orderNo": 1
  }
}
```

---

# Get Lessons By Course

## GET `/courses/:courseId/lessons`

---

## Query Params

| Param | Type |
|---|---|
| page | number |
| limit | number |

---

# Get Lesson Detail

## GET `/lessons/:lessonId`

---

# Update Lesson

## PATCH `/lessons/:lessonId`

---

## Request Body

```json
{
  "title": "Updated Lesson",
  "description": "Updated content"
}
```

---

# Delete Lesson

## DELETE `/lessons/:lessonId`

---

# Classroom Lesson APIs

---

# Publish Lesson To Classroom

## POST `/classes/:classroomId/lessons`

---

## Description

Publish reusable Lesson into Classroom.

---

## Request Body

```json
{
  "lessonId": "lesson_uuid",
  "isPublished": true
}
```

---

## Response

```json
{
  "success": true,
  "data": {
    "classroomId": "class_uuid",
    "lessonId": "lesson_uuid",
    "isPublished": true
  }
}
```

---

# Get Classroom Lessons

## GET `/classes/:classroomId/lessons`

---

## Query Params

| Param | Type |
|---|---|
| publishedOnly | boolean |

---

## Response

```json
{
  "success": true,
  "data": [
    {
      "lessonId": "lesson_uuid",
      "title": "Derivatives",
      "description": "Introduction",
      "orderNo": 1,
      "isPublished": true
    }
  ]
}
```

---

# Update Classroom Lesson

## PATCH `/classes/:classroomId/lessons/:lessonId`

---

## Request Body

```json
{
  "isPublished": false
}
```

---

# Remove Lesson From Classroom

## DELETE `/classes/:classroomId/lessons/:lessonId`

---

# Pagination Format

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

# Authorization Rules

| API | Teacher | Student |
|---|---|---|
| Create Course | ✅ | ❌ |
| Update Course | Owner only | ❌ |
| Delete Course | Owner only | ❌ |
| Create Classroom | ✅ | ❌ |
| Join Classroom | ❌ | ✅ |
| Add Student | ✅ | ❌ |
| Create Lesson | ✅ | ❌ |
| Publish Lesson | ✅ | ❌ |
| View Published Lessons | ✅ | ✅ |

---

# Validation Rules

| Field | Validation |
|---|---|
| courseId | UUID |
| classId | UUID |
| lessonId | UUID |
| name | minimum 2 characters |
| inviteCode | unique |
| orderNo | positive integer |
| startAt | must be before endAt |

---

# Suggested Error Codes

| Code | Meaning |
|---|---|
| RESOURCE_NOT_FOUND | Entity not found |
| VALIDATION_ERROR | Invalid request |
| FORBIDDEN | No permission |
| UNAUTHORIZED | Login required |
| DUPLICATE_RESOURCE | Duplicate data |
| LESSON_ALREADY_ASSIGNED | Lesson already in classroom |

---

# Recommended HTTP Status Codes

| Action | Status |
|---|---|
| Create success | 201 |
| Update success | 200 |
| Delete success | 200 |
| Validation error | 400 |
| Unauthorized | 401 |
| Forbidden | 403 |
| Not found | 404 |
| Conflict | 409 |

---

# Suggested Future APIs

---

# Classroom Analytics

```txt
GET /classes/:id/analytics
```

---

# Lesson Materials

```txt
POST /lessons/:lessonId/materials
GET /lessons/:lessonId/materials
DELETE /materials/:materialId
```

---

# Classroom Progress

```txt
GET /classes/:id/progress
```

---

# AI Learning Roadmaps

```txt
GET /students/:studentId/roadmaps
POST /students/:studentId/roadmaps/generate
```

---

# Recommended NestJS Structure

```txt
modules/
└── academic/
    ├── courses/
    │   ├── dto/
    │   ├── courses.controller.ts
    │   ├── courses.service.ts
    │   └── courses.module.ts
    │
    ├── classrooms/
    │   ├── dto/
    │   ├── classrooms.controller.ts
    │   ├── classrooms.service.ts
    │   └── classrooms.module.ts
    │
    ├── enrollments/
    │   ├── dto/
    │   ├── enrollments.controller.ts
    │   ├── enrollments.service.ts
    │   └── enrollments.module.ts
    │
    └── lessons/
        ├── dto/
        ├── lessons.controller.ts
        ├── lessons.service.ts
        └── lessons.module.ts
```
