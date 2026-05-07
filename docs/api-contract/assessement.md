# Assessment Module API Contract

## Base URL

```txt
/api/assessments
```

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

Assessment Domain chịu trách nhiệm cho toàn bộ quy trình kiểm tra và đánh giá học sinh trong hệ thống EdTech AI.

Bao gồm:

+ tạo bài kiểm tra
+ quản lý câu hỏi
+ nộp bài
+ chấm điểm AI
+ kết quả học tập
+ analytics & grading
+ anti-cheating
+ exam lifecycle

---

# Module Structure

```txt
modules/
└── assessments/
    ├── exams/
    ├── questions/
    ├── submissions/
    ├── grading/
    ├── analytics/
    └── shared/
```

---

# Prisma Models

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

## ExamStatus

```prisma
enum ExamStatus {
  draft
  published
  ongoing
  completed
  archived
}
```

---

## QuestionType

```prisma
enum QuestionType {
  multiple_choice
  single_choice
  true_false
  short_answer
  essay
  fill_blank
}
```

---

## SubmissionStatus

```prisma
enum SubmissionStatus {
  in_progress
  submitted
  graded
  cancelled
}
```

---

# Exams APIs

## POST `/exams`

Create exam.

### Request Body

```json
{
  "classId": "uuid",
  "title": "Calculus Midterm",
  "description": "Chapter 1-5",
  "duration": 90
}
```

### Response

```json
{
  "id": "exam_uuid",
  "status": "draft"
}
```

---

## GET `/exams`

Get exams list.

### Query Params

```txt
classId?: uuid
status?: draft|published|ongoing|completed
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
  "title": "Calculus Midterm",
  "description": "Chapter 1-5",
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
  "title": "Updated Midterm",
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

## POST `/exams/:examId/archive`

Archive exam.

---

## POST `/exams/:examId/duplicate`

Duplicate exam.

### Response

```json
{
  "newExamId": "uuid"
}
```

---

# Questions APIs

## POST `/exams/:examId/questions`

Create question.

### Request Body

```json
{
  "type": "multiple_choice",
  "prompt": "What is derivative of x^2?",
  "options": [
    "2x",
    "x",
    "x^2"
  ],
  "answerKey": {
    "correct": "2x"
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
  "prompt": "Updated question",
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

## GET `/my-exams`

Get student assigned exams.

### Query Params

```txt
status?: ongoing|completed
```

---

## GET `/my-exams/:examId`

Get student exam detail.

---

## POST `/my-exams/:examId/start`

Start exam attempt.

### Response

```json
{
  "submissionId": "uuid",
  "startAt": "2026-05-07T10:00:00.000Z"
}
```

---

## POST `/my-exams/:examId/submit`

Submit exam.

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

### Response

```json
{
  "submissionId": "uuid",
  "status": "submitted"
}
```

---

## POST `/my-exams/:examId/auto-save`

Auto save draft answers.

### Request Body

```json
{
  "answers": []
}
```

---

# Submissions APIs

## GET `/submissions`

Get submissions list.

### Query Params

```txt
examId?: uuid
studentId?: uuid
status?: submitted|graded
page?: number
limit?: number
```

---

## GET `/submissions/:submissionId`

Get submission detail.

### Response

```json
{
  "id": "submission_uuid",
  "studentId": "student_uuid",
  "status": "graded",
  "answers": [],
  "result": {
    "score": 8.5
  }
}
```

---

## POST `/submissions/:submissionId/regrade`

Regrade submission by AI.

### Response

```json
{
  "submissionId": "uuid",
  "status": "regrading"
}
```

---

# Results APIs

## GET `/results/:submissionId`

Get exam result.

### Response

```json
{
  "score": 8.5,
  "gradedByAi": true,
  "gradedAt": "2026-05-07T10:00:00.000Z",
  "feedback": {
    "strengths": [],
    "weaknesses": [],
    "recommendations": []
  }
}
```

---

## GET `/results/me`

Get current student results.

### Query Params

```txt
classId?: uuid
page?: number
limit?: number
```

---

## GET `/results/analytics`

Get exam analytics.

### Response

```json
{
  "averageScore": 7.2,
  "highestScore": 10,
  "lowestScore": 3,
  "submissionCount": 40
}
```

---

# AI Grading APIs

## POST `/grading/ai`

Trigger AI grading.

### Request Body

```json
{
  "submissionId": "uuid"
}
```

---

## POST `/grading/ai/bulk`

Bulk AI grading.

### Request Body

```json
{
  "submissionIds": [
    "uuid"
  ]
}
```

---

## GET `/grading/jobs/:jobId`

Get grading job status.

### Response

```json
{
  "jobId": "uuid",
  "status": "processing",
  "progress": 65
}
```

---

# Anti-Cheat APIs

## POST `/proctoring/events`

Track suspicious events.

### Request Body

```json
{
  "submissionId": "uuid",
  "type": "tab_switch",
  "metadata": {}
}
```

---

## GET `/proctoring/submissions/:submissionId`

Get cheating risk analysis.

### Response

```json
{
  "riskLevel": "medium",
  "events": []
}
```

---

# Validation Rules

| Field     | Validation              |
| ----------| ----------------------- |
| classId   | UUID                    |
| examId    | UUID                    |
| duration  | positive integer        |
| points    | positive number         |
| orderNo   | positive integer        |
| score     | 0 → max exam score      |

---

# Authorization Rules

| API                  | Teacher | Student | AI/System |
| -------------------- | ------- | -------- | ---------- |
| Create Exam          | ✅       | ❌        | ❌          |
| Publish Exam         | ✅       | ❌        | ❌          |
| Submit Exam          | ❌       | ✅        | ❌          |
| View Own Submission  | ❌       | ✅        | ❌          |
| Grade Submission     | ✅       | ❌        | ✅          |
| View Analytics       | ✅       | ❌        | ❌          |

---

# Suggested Background Jobs

| Job                     | Purpose                    |
| ----------------------- | -------------------------- |
| ai_exam_generation      | generate AI exams          |
| ai_question_generation  | generate questions         |
| auto_grading            | auto grade submissions     |
| plagiarism_detection    | detect copied answers      |
| anti_cheat_analysis     | analyze suspicious actions |
| result_analytics        | compute exam analytics     |

---

# Suggested Future Expansion

## Adaptive Exam APIs

```txt
POST /adaptive-exams/generate
```

---

## AI Oral Exam APIs

```txt
POST /oral-exams/start
```

---

## Coding Assessment APIs

```txt
POST /coding-exams/submissions
```
