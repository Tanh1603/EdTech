# EdTech AI Platform - Database Architecture

# 1. Tổng Quan Kiến Trúc

Hệ thống được chia thành các domain/module rõ ràng:

```text
Academic Module
Learning Module
AI Module
Notification Module
Analytics Module
System Module
```

---

# 2. Domain Structure

## 2.1 Academic Module (Core LMS)

Quản lý học tập, lớp học, bài học, tài liệu, bài thi.

### Tables

* Course
* Classroom
* ClassMembership
* Lesson
* Material
* MaterialChunk
* Assignment
* Exam
* Question
* Submission
* Result

---

## 2.2 Learning Module

Cá nhân hóa việc học.

### Tables

* LearningProfile
* LessonProgress
* StudentTopicMastery

---

## 2.3 AI Module

AI chat, orchestration, RAG, background jobs.

### Tables

* ChatSession
* ChatMessage
* MaterialEmbedding
* Job

---

## 2.4 Notification Module

Thông báo hệ thống.

### Tables

* Notification

---

## 2.5 Analytics Module

Thống kê hệ thống.

### Tables

* AnalyticsSnapshot

---

## 2.6 System Module

Audit, logging.

### Tables

* AuditLog

---

# 3. Final Learning Flow

```text
Course
  -> Classroom
      -> Lesson
          -> Material
          -> Exam
          -> Assignment
```

Đây là flow LMS chuẩn thực tế.

---

# 4. Core Database Tables

# 4.1 Course

Đại diện cho môn học / khóa học.

Ví dụ:

* Toán 12
* Lập trình Web
* AI Fundamentals

## Responsibilities

* Quản lý thông tin khóa học
* Chứa nhiều lớp học
* Chứa tài liệu tổng quát

---

# 4.2 Classroom

Đại diện cho lớp học cụ thể.

Ví dụ:

* Toán 12A1
* Web Programming K2026

## Responsibilities

* Sinh viên tham gia lớp
* Có lịch học
* Có bài học riêng
* Có exam riêng

---

# 4.3 ClassMembership

Quản lý user trong lớp.

## Roles

```text
teacher
student
```

---

# 4.4 Lesson (QUAN TRỌNG)

Bảng còn thiếu trong schema cũ.

## Responsibilities

* Đại diện cho bài học
* Chứa materials
* Chứa exams
* Tracking progress

## Example

```text
Lesson 1: Introduction
Lesson 2: Arrays
Lesson 3: Database Basics
```

## Prisma Model

```prisma
model Lesson {
  id          String      @id @default(uuid()) @db.Uuid
  classId     String      @map("class_id") @db.Uuid

  title       String
  description String?

  orderNo     Int?        @map("order_no")

  startsAt    DateTime?   @map("starts_at") @db.Timestamptz(6)
  endsAt      DateTime?   @map("ends_at") @db.Timestamptz(6)

  createdAt   DateTime    @default(now()) @map("created_at") @db.Timestamptz(6)

  classroom   Classroom   @relation(fields: [classId], references: [id])

  materials   Material[]
  exams       Exam[]

  @@map("lessons")
}
```

---

# 4.5 Material

Lưu file học tập.

## Supported Files

* PDF
* DOCX
* PPTX
* Video
* Image

## Storage

Nên dùng:

* Cloudinary
* AWS S3
* Cloudflare R2

## Prisma Model

```prisma
model Material {
  id            String         @id @default(uuid()) @db.Uuid

  lessonId      String?        @map("lesson_id") @db.Uuid
  uploadedBy    String?        @map("uploaded_by")

  title         String

  storageUrl    String?        @map("storage_url")
  thumbnailUrl  String?        @map("thumbnail_url")

  mimeType      String?        @map("mime_type")
  fileSize      Int?           @map("file_size")

  status        MaterialStatus @default(uploaded)

  createdAt     DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)

  lesson        Lesson?        @relation(fields: [lessonId], references: [id])

  chunks        MaterialChunk[]

  @@index([lessonId, status])

  @@map("materials")
}
```

---

# 4.6 MaterialChunk

Dùng cho AI RAG.

## Responsibilities

* Chunk text
* Semantic search
* Vector retrieval
* Embedding indexing

## Vì sao cần?

Nếu không có:

* AI search yếu
* Retrieval kém
* Không scalable

## Prisma Model

```prisma
model MaterialChunk {
  id           String    @id @default(uuid()) @db.Uuid

  materialId   String    @map("material_id") @db.Uuid

  orderNo      Int?      @map("order_no")

  vectorDocId  String?   @map("vector_doc_id")

  tokenCount   Int?      @map("token_count")

  checksum     String?

  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)

  material     Material  @relation(fields: [materialId], references: [id])

  @@map("material_chunks")
}
```

---

# 4.7 MaterialEmbedding

Metadata embedding cho AI.

## Prisma Model

```prisma
model MaterialEmbedding {
  id           String   @id @default(uuid()) @db.Uuid

  chunkId      String   @unique @map("chunk_id") @db.Uuid

  provider     String?

  embeddingId  String?  @map("embedding_id")

  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  chunk        MaterialChunk @relation(fields: [chunkId], references: [id])

  @@map("material_embeddings")
}
```

---

# 4.8 Exam

Bài kiểm tra.

## Responsibilities

* Quiz
* Midterm
* Final exam

---

# 4.9 Question

Ngân hàng câu hỏi.

## Types

```text
mcq
true_false
short_answer
essay
```

---

# 4.10 Submission

Bài nộp của học sinh.

---

# 4.11 Result

Kết quả chấm điểm.

---

# 4.12 Assignment

Bài tập về nhà.

## Prisma Model

```prisma
model Assignment {
  id          String    @id @default(uuid()) @db.Uuid

  classId     String    @map("class_id") @db.Uuid

  title       String

  description String?

  dueAt       DateTime? @map("due_at") @db.Timestamptz(6)

  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)

  @@map("assignments")
}
```

---

# 4.13 LessonProgress

Tracking tiến độ học tập.

## Responsibilities

* Theo dõi học sinh học tới đâu
* Progress %
* AI recommendation

## Prisma Model

```prisma
model LessonProgress {
  id            String    @id @default(uuid()) @db.Uuid

  lessonId      String    @map("lesson_id") @db.Uuid

  studentId     String    @map("student_id")

  completed     Boolean   @default(false)

  progressPct   Int?      @default(0) @map("progress_pct")

  lastViewedAt  DateTime? @map("last_viewed_at") @db.Timestamptz(6)

  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)

  @@unique([lessonId, studentId])

  @@map("lesson_progress")
}
```

---

# 4.14 LearningProfile

AI personalization.

## Responsibilities

* Mục tiêu học tập
* Điểm yếu
* Preferred language
* Weekly study hours

---

# 4.15 StudentTopicMastery

Tracking độ thành thạo từng topic.

Ví dụ:

* Algebra: 80%
* Calculus: 40%

AI dùng để:

* Recommend learning path
* Generate exercises
* Analyze weaknesses

---

# 4.16 ChatSession

Lưu AI conversations.

---

# 4.17 ChatMessage

Tin nhắn AI/user.

## Roles

```text
user
assistant
system
```

---

# 4.18 Job

Background processing queue.

## Job Types

```text
ai_grade
ai_analyze
ai_generate_exam
material_ingest
rag_index
notification_dispatch
```

---

# 4.19 Notification

Thông báo hệ thống.

---

# 4.20 AnalyticsSnapshot

Dashboard metrics.

## Example

```json
{
  "activeStudents": 1200,
  "completionRate": 85,
  "avgScore": 7.8
}
```

---

# 4.21 AuditLog

Theo dõi hành động hệ thống.

## Example

```text
USER_JOINED_CLASS
CREATE_EXAM
DELETE_MATERIAL
GRADE_SUBMISSION
```

---

# 5. Những Bảng Có Thể Bỏ Nếu Làm Đồ Án

## Optional Tables

* AnalyticsSnapshot
* AuditLog
* NotificationRecipient
* ExamVersion

---

# 6. Những Bảng BẮT BUỘC nên giữ

```text
Course
Classroom
Lesson
Material
MaterialChunk
Exam
Question
Submission
Result
LearningProfile
ChatSession
ChatMessage
```

---

# 7. Vì Sao Không Nên Lưu Materials Dạng JSON

## Sai cách

```json
materials: []
```

## Vấn đề

* Không query được
* Không paginate được
* Không AI indexing được
* Không analytics được
* Không scalable

## Kết luận

Phải dùng bảng riêng.

---

# 8. Final Recommendation

## Recommended Architecture

```text
Frontend (NextJS)

    ↓

Backend API (NestJS)
- Auth
- Course
- Classroom
- Lesson
- Exam
- Learning

    ↓

AI Service
- Multi Agent
- RAG
- Recommendation
- Exam Generation
- Grading

    ↓

Vector DB
(Pinecone / Qdrant)

    ↓

Storage
(Cloudinary / S3 / R2)

    ↓

PostgreSQL
```

---

# 9. Best Practice Cho Đồ Án

## Nên giữ scope:

### Core LMS

* course
* classroom
* lesson
* material

### AI Features

* ai chat
* rag
* grading
* recommendation

### Analytics

* progress
* mastery

Đây là scope đủ lớn và chuyên nghiệp cho đồ án tốt nghiệp.


modules/
├── auth/
├── users/

├── academic/
│   ├── courses/
│   ├── classrooms/
│   ├── lessons/
│   ├── enrollments/
│   └── roadmaps/

├── learning/
│   ├── materials/
│   ├── chat/
│   ├── mastery/
│   └── uploads/

├── exams/
│   ├── exams/
│   ├── questions/
│   ├── submissions/
│   └── grading/

├── ai/
│   ├── orchestrator/
│   ├── agents/
│   ├── rag/
│   ├── embeddings/
│   └── providers/

├── analytics/
├── notifications/
├── jobs/
├── storage/
└── common/
