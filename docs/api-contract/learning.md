# Learning Module API Contract

## Base URL

```txt
/api
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

Learning Domain chịu trách nhiệm cho toàn bộ logic học tập cá nhân hóa trong hệ thống EdTech AI.

Domain này tập trung vào:

+ quản lý tài liệu học tập
+ AI indexing & RAG
+ roadmap học tập cá nhân
+ recommendation engine
+ theo dõi mastery của học sinh
+ adaptive learning
---

# Module Structure

```txt
modules/
└── learning/
    ├── materials/
    ├── roadmaps/
    ├── recommendations/
    └── mastery/
```

---

# Prisma Models

---

## Material

```prisma
model Material {
  id         String         @id @default(dbgenerated("gen_random_uuid()"))
  lessonId   String         @map("lesson_id") @db.Uuid
  title      String
  storageUrl String         @map("storage_url")
  publicId   String?        @map("public_id")
  mimeType   String?        @map("mime_type")
  size       Int?
  status     MaterialStatus @default(uploaded)
  createdBy  String         @map("created_by")
  createdAt  DateTime       @default(now()) @map("created_at")

  lesson Lesson          @relation(fields: [lessonId], references: [id])
  chunks MaterialChunk[]

  @@index([lessonId, status])
  @@map("materials")
}
```

---

## MaterialChunk

```prisma
model MaterialChunk {
  id          String   @id @default(dbgenerated("gen_random_uuid()"))
  materialId  String   @map("material_id")
  content     String
  orderNo     Int      @map("order_no")
  tokenCount  Int?     @map("token_count")
  embeddingId String?  @map("embedding_id")
  checksum    String?  @map("check_sum")
  createdAt   DateTime @default(now()) @map("created_at")

  material Material @relation(fields: [materialId], references: [id])

  @@index([materialId, orderNo])
  @@map("material_chunks")
}
```

---

## LearningRoadmap

```prisma
model LearningRoadmap {
  id            String        @id @default(dbgenerated("gen_random_uuid()"))
  userId        String        @map("user_id")
  title         String
  targetGoal    String?       @map("target_goal")
  status        RoadmapStatus @default(active)
  generatedByAi Boolean       @default(true) @map("generated_by_ai")
  createdAt     DateTime      @default(now()) @map("created_at")

  items RoadmapItem[]

  @@map("learning_roadmaps")
}
```

---

## RoadmapItem

```prisma
model RoadmapItem {
  id          String  @id @default(dbgenerated("gen_random_uuid()"))
  roadmapId   String  @map("roadmap_id") @db.Uuid
  title       String
  description String?
  topic       String?
  orderNo     Int     @map("order_no")
  isCompleted Boolean @default(false) @map("is_completed")

  roadmap LearningRoadmap @relation(fields: [roadmapId], references: [id])

  @@index([roadmapId, orderNo])
  @@map("roadmap_items")
}
```

---

## StudentTopicMastery

```prisma
model StudentTopicMastery {
  id           String   @id @default(dbgenerated("gen_random_uuid()"))
  studentId    String   @map("student_id")
  classId      String   @map("class_id") @db.Uuid
  topic        String
  masteryScore Float    @map("mastery_score")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@unique([studentId, classId, topic])
  @@map("student_topic_mastery")
}
```

---

# Materials APIs

---

# Upload Material

## POST `/materials`

Upload lesson material.

Supports:

* PDF
* DOCX
* PPTX
* Images
* Video

---

## Multipart Form Data

```txt
file: binary
lessonId: uuid
title: string
```

---

## Response

```json
{
  "success": true,
  "data": {
    "id": "material_uuid",
    "lessonId": "lesson_uuid",
    "title": "Chapter 1 PDF",
    "storageUrl": "https://cdn.domain.com/file.pdf",
    "mimeType": "application/pdf",
    "size": 2048000,
    "status": "uploaded"
  }
}
```

---

# Get Lesson Materials

## GET `/materials?lessonId=lesson_uuid`

---

## Response

```json
{
  "success": true,
  "data": [
    {
      "id": "material_uuid",
      "title": "Chapter 1 PDF",
      "mimeType": "application/pdf",
      "status": "ready"
    }
  ]
}
```

---

# Get Material Detail

## GET `/materials/:materialId`

---

## Response

```json
{
  "success": true,
  "data": {
    "id": "material_uuid",
    "title": "Chapter 1 PDF",
    "storageUrl": "https://cdn.domain.com/file.pdf",
    "mimeType": "application/pdf",
    "status": "ready",
    "chunksCount": 25
  }
}
```

---

# Delete Material

## DELETE `/materials/:materialId`

---

# Reindex Material

## POST `/materials/:materialId/reindex`

Used for:

* regenerate embeddings
* AI indexing
* chunk recreation

---

# Material Chunks APIs

---

# Get Material Chunks

## GET `/materials/:materialId/chunks`

---

## Response

```json
{
  "success": true,
  "data": [
    {
      "id": "chunk_uuid",
      "orderNo": 1,
      "content": "Introduction to calculus...",
      "tokenCount": 250
    }
  ]
}
```

---

# Roadmaps APIs

---

# Create AI Roadmap

## POST `/roadmaps/generate`

Generate personalized roadmap by AI.

---

## Request Body

```json
{
  "targetGoal": "Master Calculus",
  "weakTopics": [
    "Derivative",
    "Integral"
  ],
  "classId": "class_uuid"
}
```

---

## Response

```json
{
  "success": true,
  "data": {
    "roadmapId": "roadmap_uuid",
    "generatedByAi": true
  }
}
```

---

# Get My Roadmaps

## GET `/roadmaps`

---

## Response

```json
{
  "success": true,
  "data": [
    {
      "id": "roadmap_uuid",
      "title": "Calculus Learning Path",
      "targetGoal": "Master Calculus",
      "status": "active"
    }
  ]
}
```

---

# Get Roadmap Detail

## GET `/roadmaps/:roadmapId`

---

## Response

```json
{
  "success": true,
  "data": {
    "id": "roadmap_uuid",
    "title": "Calculus Learning Path",
    "items": [
      {
        "id": "item_uuid",
        "title": "Learn Derivatives",
        "topic": "Derivative",
        "orderNo": 1,
        "isCompleted": false
      }
    ]
  }
}
```

---

# Update Roadmap Item Completion

## PATCH `/roadmaps/items/:itemId`

---

## Request Body

```json
{
  "isCompleted": true
}
```

---

# Delete Roadmap

## DELETE `/roadmaps/:roadmapId`

---

# Recommendations APIs

---

# Get Learning Recommendations

## GET `/recommendations`

AI recommends:

* lessons
* materials
* exercises
* weak topics

based on mastery + exam results.

---

## Response

```json
{
  "success": true,
  "data": {
    "weakTopics": [
      "Integral"
    ],
    "recommendedLessons": [
      {
        "lessonId": "lesson_uuid",
        "title": "Integral Basics"
      }
    ],
    "recommendedMaterials": [
      {
        "materialId": "material_uuid",
        "title": "Integral PDF"
      }
    ]
  }
}
```

---

# Mastery APIs

---

# Get Student Mastery

## GET `/mastery/me`

---

## Response

```json
{
  "success": true,
  "data": [
    {
      "topic": "Derivative",
      "masteryScore": 0.82
    },
    {
      "topic": "Integral",
      "masteryScore": 0.41
    }
  ]
}
```

---

# Get Student Mastery By Class

## GET `/mastery/classes/:classId`

---

## Response

```json
{
  "success": true,
  "data": [
    {
      "topic": "Probability",
      "masteryScore": 0.65
    }
  ]
}
```

---

# Update Mastery Score

## POST `/mastery`

Usually updated by:

* AI grading
* exam results
* lesson completion
* quiz results

---

## Request Body

```json
{
  "studentId": "student_uuid",
  "classId": "class_uuid",
  "topic": "Integral",
  "masteryScore": 0.75
}
```

---

# Authorization Rules

| API              | Teacher        | Student  |
| ---------------- | -------------- | -------- |
| Upload Material  | ✅              | ❌        |
| Delete Material  | Owner only     | ❌        |
| Generate Roadmap | ❌              | ✅        |
| View Own Roadmap | ❌              | ✅        |
| Update Mastery   | System/AI only | ❌        |
| View Mastery     | ✅              | Own only |

---

# Validation Rules

| Field        | Validation       |
| ------------ | ---------------- |
| lessonId     | UUID             |
| roadmapId    | UUID             |
| title        | min 2 chars      |
| masteryScore | 0 → 1            |
| orderNo      | positive integer |
| file size    | max configurable |

---

# Suggested Background Jobs

| Job                   | Purpose                |
| --------------------- | ---------------------- |
| material_ingest       | parse uploaded files   |
| material_chunking     | split text into chunks |
| rag_embedding         | create embeddings      |
| ai_roadmap_generation | generate roadmap       |
| mastery_analysis      | calculate mastery      |

---

# Suggested Future APIs

## AI Chat With Materials

```txt
POST /learning/chat
```

---

## Semantic Search

```txt
GET /materials/search?q=integral
```

---

## Recommended Next Lesson

```txt
GET /roadmaps/next
```
