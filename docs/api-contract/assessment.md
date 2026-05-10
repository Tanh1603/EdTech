# Assessment Module API Contract

## Base URL

```txt
/api/assessments
```

Public client contract is exposed by API Gateway Swagger at `GET /api/docs`.

---

# Standard Response Format

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

# Domain Overview

Assessment Domain chịu trách nhiệm cho toàn bộ hệ thống:

- exams
- quizzes
- submissions
- grading
- AI grading
- feedback
- scoring
- exam analytics

Domain này tách biệt khỏi Learning Domain để dễ scale và maintain.

---

# Module Structure

```txt
modules/
└── assessments/
    ├── exams/
    ├── questions/
    ├── submissions/
    ├── results/
    ├── analytics/
    └── shared/
```

---

# Prisma Models

---

## Exam

```prisma
model Exam {
  id          String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  classId     String     @map("class_id") @db.Uuid
  title       String
  description String?
  duration    Int
  status      ExamStatus @default(draft)
  createdBy   String     @map("created_by") @db.Uuid
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  classroom Classroom @relation(fields: [classId], references: [id])

  questions   Question[]
  submissions Submission[]

  @@map("exams")
}
```

---

## Question

```prisma
model Question {
  id          String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  examId      String       @map("exam_id") @db.Uuid
  type        QuestionType
  prompt      String
  options     Json?
  answerKey   Json?        @map("answer_key")
  explanation String?
  points      Float
  orderNo     Int          @map("order_no")

  exam Exam @relation(fields: [examId], references: [id])

  @@index([examId, orderNo])
  @@map("questions")
}
```

---

## Submission

```prisma
model Submission {
  id          String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  examId      String           @map("exam_id") @db.Uuid
  studentId   String           @map("student_id")
  status      SubmissionStatus @default(in_progress)
  answers     Json?
  startAt     DateTime         @default(now()) @map("start_at")
  submittedAt DateTime?        @map("submitted_at")

  exam   Exam    @relation(fields: [examId], references: [id])
  result Result?

  @@unique([examId, studentId])
  @@map("submissions")
}
```

---

## Result

```prisma
model Result {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  submissionId String    @unique @map("submission_id") @db.Uuid
  score        Float
  feedback     Json?
  gradedByAi   Boolean   @default(true) @map("graded_by_ai")
  gradedAt     DateTime? @map("graded_at")

  submission Submission @relation(fields: [submissionId], references: [id])

  @@map("results")
}
```

---

# Enums

```prisma
enum ExamStatus {
  draft
  published
  closed
  archived
}

enum QuestionType {
  multiple_choice
  single_choice
  true_false
  short_answer
  essay
  coding
}

enum SubmissionStatus {
  in_progress
  submitted
  graded
  expired
}
```

---

# Exams APIs

---

## POST `/exams`

Create exam.

### Request Body

```json
{
  "classId": "uuid",
  "title": "Midterm Exam",
  "description": "Calculus midterm",
  "duration": 90
}
```

### Response

```json
{
  "id": "exam_uuid",
  "title": "Midterm Exam",
  "status": "draft"
}
```

---

## GET `/exams`

Get exams list.

### Query Params

```txt
classId?: uuid
status?: draft|published|closed|archived
page?: number
limit?: number
search?: string
```

---

## GET `/exams/:examId`

Get exam detail.

### Response

```json
{
  "id": "exam_uuid",
  "title": "Midterm Exam",
  "description": "Calculus midterm",
  "duration": 90,
  "status": "published",
  "questionsCount": 20,
  "createdAt": "2026-05-07T10:00:00.000Z"
}
```

---

## PATCH `/exams/:examId`

Update exam.

### Request Body

```json
{
  "title": "Updated title",
  "duration": 120
}
```

---

## DELETE `/exams/:examId`

Soft delete exam.

---

## POST `/exams/:examId/publish`

Publish exam.

### Response

```json
{
  "examId": "uuid",
  "status": "published"
}
```

---

## POST `/exams/:examId/close`

Close exam.

### Response

```json
{
  "examId": "uuid",
  "status": "closed"
}
```

---

# Questions APIs

---

## POST `/exams/:examId/questions`

Create question.

### Request Body

```json
{
  "type": "multiple_choice",
  "prompt": "What is derivative of x²?",
  "options": [
    "x",
    "2x",
    "x²"
  ],
  "answerKey": {
    "correctOption": 1
  },
  "points": 1,
  "orderNo": 1
}
```

---

## GET `/exams/:examId/questions`

Get exam questions.

---

## GET `/questions/:questionId`

Get question detail.

---

## PATCH `/questions/:questionId`

Update question.

### Request Body

```json
{
  "prompt": "Updated prompt",
  "points": 2
}
```

---

## DELETE `/questions/:questionId`

Delete question.

---

## POST `/questions/reorder`

Reorder questions.

### Request Body

```json
{
  "items": [
    {
      "questionId": "uuid",
      "orderNo": 1
    }
  ]
}
```

---

# Student Exam APIs

---

## POST `/exams/:examId/start`

Start exam attempt.

### Response

```json
{
  "submissionId": "submission_uuid",
  "status": "in_progress",
  "startAt": "2026-05-07T10:00:00.000Z"
}
```

---

## GET `/submissions/:submissionId`

Get submission detail.

---

## PATCH `/submissions/:submissionId/answers`

Autosave answers.

### Request Body

```json
{
  "answers": [
    {
      "questionId": "uuid",
      "answer": "2x"
    }
  ]
}
```

---

## POST `/submissions/:submissionId/submit`

Submit exam.

### Response

```json
{
  "submissionId": "uuid",
  "status": "submitted"
}
```

---

# Results APIs

---

## GET `/results/:submissionId`

Get exam result.

### Response

```json
{
  "submissionId": "uuid",
  "score": 8.5,
  "gradedByAi": true,
  "feedback": {
    "strengths": [
      "Good derivative understanding"
    ],
    "weaknesses": [
      "Integral mistakes"
    ]
  }
}
```

---

## POST `/results/:submissionId/regrade`

Regrade submission.

### Response

```json
{
  "submissionId": "uuid",
  "status": "regrading"
}
```

---

## POST `/results/:submissionId/manual-grade`

Teacher manual grading.

### Request Body

```json
{
  "score": 9,
  "feedback": {
    "comment": "Well done"
  }
}
```

---

# Analytics APIs

---

## GET `/analytics/exams/:examId`

Get exam analytics.

### Response

```json
{
  "averageScore": 7.2,
  "highestScore": 10,
  "lowestScore": 3,
  "submissionCount": 45
}
```

---

## GET `/analytics/exams/:examId/questions`

Get question analytics.

### Response

```json
{
  "questions": [
    {
      "questionId": "uuid",
      "correctRate": 0.62
    }
  ]
}
```

---

## GET `/analytics/students/:studentId`

Get student assessment analytics.

### Response

```json
{
  "averageScore": 8.1,
  "completedExams": 12,
  "weakTopics": [
    "Integral"
  ]
}
```

---

# AI Grading APIs

---

## POST `/ai-grading/submissions/:submissionId`

Trigger AI grading.

### Response

```json
{
  "submissionId": "uuid",
  "status": "grading"
}
```

---

## GET `/ai-grading/jobs/:jobId`

Get grading job status.

### Response

```json
{
  "jobId": "uuid",
  "status": "completed"
}
```

---

# Validation Rules

| Field        | Validation         |
| ------------- | ------------------ |
| classId       | UUID               |
| examId        | UUID               |
| duration      | positive integer   |
| points        | positive float     |
| orderNo       | positive integer   |
| questionType  | enum               |
| score         | 0 → max exam score |

---

# Authorization Rules

| API                 | Teacher | Student |
| ------------------- | -------- | -------- |
| Create Exam         | ✅        | ❌        |
| Update Exam         | Owner    | ❌        |
| Delete Exam         | Owner    | ❌        |
| Publish Exam        | Owner    | ❌        |
| Create Question     | Owner    | ❌        |
| Start Exam          | ❌        | ✅        |
| Submit Exam         | ❌        | ✅        |
| View Own Result     | ❌        | ✅        |
| Manual Grade        | Teacher  | ❌        |
| AI Grade            | System   | ❌        |

---

# Suggested Background Jobs

| Job                  | Purpose                    |
| -------------------- | -------------------------- |
| ai_exam_generation   | generate AI questions      |
| auto_grading         | auto grading submissions   |
| essay_grading        | LLM essay grading          |
| plagiarism_detection | detect cheating            |
| result_analysis      | calculate analytics        |
| mastery_sync         | sync mastery into learning |

---

# Events Published

```txt
assessment.exam.created
assessment.exam.published
assessment.exam.closed
assessment.submission.started
assessment.submission.submitted
assessment.result.generated
assessment.result.regraded
```

---

# Events Consumed

```txt
classroom.student.removed
learning.mastery.updated
user.deleted
```

---

# Suggested Future Expansion

## Adaptive Exams APIs

```txt
POST /adaptive-exams/generate
```

---

## Proctoring APIs

```txt
POST /proctoring/sessions
```

---

## Anti Cheat APIs

```txt
POST /anti-cheat/analyze
```

---

## AI Feedback APIs

```txt
POST /feedback/generate
```
