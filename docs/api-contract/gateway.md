# API Gateway Public Contract

Current public ingress: `apps/api-gateway`.

Base URL:

```txt
/api
```

Swagger:

```txt
GET /api/docs
```

All public requests use Bearer auth at the Gateway. Gateway verifies the Clerk JWT, builds request metadata, and calls BE Core through gRPC + Protobuf. Client-facing request DTOs live in `@edtech/contracts`; Swagger decorators in API Gateway should reference those DTO classes directly.

## Response Envelope

All successful responses are wrapped by the Gateway:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-05-10T10:00:00.000Z",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  },
  "error": null
}
```

For non-paginated responses, `meta.pagination` is omitted. Errors are mapped from gRPC status codes to HTTP status codes and returned in the same envelope shape.

## Academic

| Method | Path | Body DTO |
| --- | --- | --- |
| GET | `/api/courses` | query `CourseQueryDto` |
| POST | `/api/courses` | `CreateCourseDto` |
| GET | `/api/courses/:courseId` | none |
| PATCH | `/api/courses/:courseId` | `UpdateCourseDto` |
| DELETE | `/api/courses/:courseId` | none |
| GET | `/api/classes` | query `ClassroomQueryDto` |
| POST | `/api/classes` | `CreateClassroomDto` |
| GET | `/api/classes/:classroomId` | none |
| PATCH | `/api/classes/:classroomId` | `UpdateClassroomDto` |
| DELETE | `/api/classes/:classroomId` | none |
| POST | `/api/classes/:classroomId/regenerate-invite-code` | none |
| POST | `/api/classes/:classId/invites` | `ClassInvitesDto` |
| POST | `/api/lessons` | `CreateLessonDto` |
| GET | `/api/courses/:courseId/lessons` | query `PaginationQueryDto` |
| GET | `/api/lessons/:lessonId` | none |
| PATCH | `/api/lessons/:lessonId` | `UpdateLessonDto` |
| DELETE | `/api/lessons/:lessonId` | none |
| POST | `/api/classes/:classroomId/lessons` | `PublishClassroomLessonDto` |
| GET | `/api/classes/:classroomId/lessons` | query `ClassroomLessonsQueryDto` |
| PATCH | `/api/classes/:classroomId/lessons/:lessonId` | `UpdateClassroomLessonDto` |
| DELETE | `/api/classes/:classroomId/lessons/:lessonId` | none |
| POST | `/api/enrollments/join` | `JoinClassroomDto` |
| POST | `/api/enrollments` | `CreateEnrollmentDto` |
| GET | `/api/classrooms/:classroomId/students` | none |
| PATCH | `/api/enrollments/:enrollmentId` | `UpdateEnrollmentDto` |
| DELETE | `/api/enrollments/:enrollmentId` | none |

## Assessments

| Method | Path | Body DTO |
| --- | --- | --- |
| POST | `/api/assessments/exams` | `CreateExamDto` |
| GET | `/api/assessments/exams` | query `ExamsQueryDto` |
| GET | `/api/assessments/exams/:examId` | none |
| PATCH | `/api/assessments/exams/:examId` | `UpdateExamDto` |
| DELETE | `/api/assessments/exams/:examId` | none |
| POST | `/api/assessments/exams/:examId/publish` | none |
| POST | `/api/assessments/exams/:examId/close` | none |
| POST | `/api/assessments/exams/:examId/questions` | `CreateQuestionDto` |
| GET | `/api/assessments/exams/:examId/questions` | none |
| GET | `/api/assessments/questions/:questionId` | none |
| PATCH | `/api/assessments/questions/:questionId` | `UpdateQuestionDto` |
| DELETE | `/api/assessments/questions/:questionId` | none |
| POST | `/api/assessments/questions/reorder` | `ReorderQuestionsDto` |
| POST | `/api/assessments/exams/:examId/start` | none |
| GET | `/api/assessments/submissions/:submissionId` | none |
| PATCH | `/api/assessments/submissions/:submissionId/answers` | `AnswersDto` |
| POST | `/api/assessments/submissions/:submissionId/submit` | none |
| GET | `/api/assessments/results/:submissionId` | none |
| POST | `/api/assessments/results/:submissionId/manual-grade` | `ManualGradeDto` |
| GET | `/api/assessments/analytics/exams/:examId` | none |
| GET | `/api/assessments/analytics/exams/:examId/questions` | none |
| GET | `/api/assessments/analytics/students/:studentId` | none |

## Chat

| Method | Path | Body DTO |
| --- | --- | --- |
| POST | `/api/chat/sessions` | `CreateChatSessionDto` |
| GET | `/api/chat/sessions` | query `ChatSessionsQueryDto` |
| GET | `/api/chat/sessions/:sessionId` | none |
| PATCH | `/api/chat/sessions/:sessionId` | `UpdateChatSessionDto` |
| DELETE | `/api/chat/sessions/:sessionId` | none |
| GET | `/api/chat/sessions/:sessionId/messages` | query `ChatMessagesQueryDto` |
| POST | `/api/chat/sessions/:sessionId/messages` | `SendMessageDto` |
| GET | `/api/chat/messages/:messageId` | none |
| DELETE | `/api/chat/messages/:messageId` | none |
| GET | `/api/chat/analytics/sessions/me` | none |
| GET | `/api/chat/analytics/classrooms/:classId` | none |

## Learning

Material upload is a two-step client flow:

1. Upload bytes with `POST /api/storage/upload`.
2. Create material metadata with `POST /api/learning/materials` using JSON body `CreateMaterialDto`.

Do not send file bytes to `/api/learning/materials`; it stores URL and metadata only.

| Method | Path | Body DTO |
| --- | --- | --- |
| POST | `/api/learning/materials` | `CreateMaterialDto` |
| GET | `/api/learning/materials` | query `MaterialQueryDto` |
| GET | `/api/learning/materials/:materialId` | none |
| PATCH | `/api/learning/materials/:materialId` | `UpdateMaterialDto` |
| DELETE | `/api/learning/materials/:materialId` | none |
| GET | `/api/learning/materials/:materialId/chunks` | query `PaginationQueryDto` |
| GET | `/api/learning/materials/:materialId/chunks/:chunkId` | none |
| POST | `/api/learning/roadmaps` | `CreateRoadmapDto` |
| GET | `/api/learning/roadmaps` | query `RoadmapQueryDto` |
| GET | `/api/learning/roadmaps/next` | none |
| GET | `/api/learning/roadmaps/:roadmapId` | none |
| PATCH | `/api/learning/roadmaps/:roadmapId` | `UpdateRoadmapDto` |
| DELETE | `/api/learning/roadmaps/:roadmapId` | none |
| POST | `/api/learning/roadmaps/:roadmapId/items` | `CreateRoadmapItemDto` |
| GET | `/api/learning/roadmaps/:roadmapId/progress` | none |
| PATCH | `/api/learning/roadmaps/items/:itemId` | `UpdateRoadmapItemDto` |
| DELETE | `/api/learning/roadmaps/items/:itemId` | none |
| POST | `/api/learning/roadmaps/items/:itemId/complete` | none |
| POST | `/api/learning/roadmaps/items/:itemId/uncomplete` | none |
| GET | `/api/learning/mastery/me` | none |
| GET | `/api/learning/mastery/classes/:classId` | none |
| GET | `/api/learning/mastery/topics/:topic` | none |
| GET | `/api/learning/mastery/analytics` | none |
| POST | `/api/learning/mastery` | `UpsertMasteryDto` |
| POST | `/api/learning/mastery/bulk` | `BulkUpsertMasteryDto` |
| GET | `/api/learning/mastery/risk-students` | none |

## Storage

| Method | Path | Body |
| --- | --- | --- |
| POST | `/api/storage/upload` | multipart `file` |
| DELETE | `/api/storage/delete` | `DeleteFileDto` |

## Users

| Method | Path | Body DTO |
| --- | --- | --- |
| GET | `/api/users` | query `UserQueryDto` |
