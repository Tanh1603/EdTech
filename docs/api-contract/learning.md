# Learning Module API Contract

## Base URL

```txt
/api/learning
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

# Module Structure

```txt
modules/
└── learning/
    ├── materials/
    ├── roadmaps/
    ├── recommendations/
    ├── mastery/
    └── shared/
```

---

# Materials APIs

## POST `/materials`

Create learning material metadata from an uploaded file URL.

File bytes are uploaded first through:

```txt
POST /api/storage/upload
```

The frontend then sends JSON metadata to `/api/learning/materials`. BE Core stores the URL and metadata only; file bytes are not sent through this endpoint or through gRPC.

### JSON Body

```json
{
  "lessonId": "lesson_uuid",
  "title": "Chapter 1 PDF",
  "storageUrl": "https://res.cloudinary.com/example/file.pdf",
  "publicId": "edtech/materials/file",
  "mimeType": "application/pdf",
  "size": 2048000
}
```

### Response

```json
{
  "id": "material_uuid",
  "lessonId": "lesson_uuid",
  "title": "Chapter 1 PDF",
  "storageUrl": "https://cdn.domain.com/file.pdf",
  "mimeType": "application/pdf",
  "size": 2048000,
  "status": "uploaded"
}
```

---

## GET `/materials`

Get materials list.

### Query Params

```txt
lessonId?: uuid
status?: uploaded|indexing|ready|failed
page?: number
limit?: number
search?: string
```

---

## GET `/materials/:materialId`

Get material detail.

### Response

```json
{
  "id": "material_uuid",
  "title": "Chapter 1 PDF",
  "storageUrl": "https://cdn.domain.com/file.pdf",
  "mimeType": "application/pdf",
  "status": "ready",
  "chunksCount": 25,
  "createdAt": "2026-05-07T10:00:00.000Z"
}
```

---

## PATCH `/materials/:materialId`

Update material metadata.

### Request Body

```json
{
  "title": "Updated title"
}
```

---

## DELETE `/materials/:materialId`

Soft delete material.

---

## GET `/materials/:materialId/chunks`

Get material chunks.

### Query Params

```txt
page?: number
limit?: number
```

---

## GET `/materials/:materialId/chunks/:chunkId`

Get chunk detail.

---

# Roadmaps APIs

## POST `/roadmaps`

Create manual roadmap.

### Request Body

```json
{
  "title": "Frontend roadmap",
  "targetGoal": "Become React developer"
}
```

---

## GET `/roadmaps`

Get current user roadmaps.

### Query Params

```txt
status?: active|completed|paused
page?: number
limit?: number
```

---

## GET `/roadmaps/:roadmapId`

Get roadmap detail.

---

## PATCH `/roadmaps/:roadmapId`

Update roadmap.

### Request Body

```json
{
  "title": "Updated roadmap",
  "status": "paused"
}
```

---

## DELETE `/roadmaps/:roadmapId`

Delete roadmap.

---

## POST `/roadmaps/:roadmapId/items`

Create roadmap item.

### Request Body

```json
{
  "title": "Learn Derivatives",
  "topic": "Derivative",
  "orderNo": 1
}
```

---

## PATCH `/roadmaps/items/:itemId`

Update roadmap item.

### Request Body

```json
{
  "title": "Learn Integrals",
  "isCompleted": true
}
```

---

## DELETE `/roadmaps/items/:itemId`

Delete roadmap item.

---

## POST `/roadmaps/items/:itemId/complete`

Mark roadmap item completed.

---

## POST `/roadmaps/items/:itemId/uncomplete`

Mark roadmap item incomplete.

---

## GET `/roadmaps/:roadmapId/progress`

Get roadmap progress summary.

### Response

```json
{
  "totalItems": 20,
  "completedItems": 12,
  "progressPercent": 60
}
```

---

## GET `/roadmaps/next`

Get next recommended roadmap item.

### Response

```json
{
  "itemId": "item_uuid",
  "title": "Learn Integrals"
}
```

---

# Mastery APIs

## GET `/mastery/me`

Get current student mastery.

---

## GET `/mastery/classes/:classId`

Get mastery by class.

---

## GET `/mastery/topics/:topic`

Get mastery history by topic.

---

## GET `/mastery/analytics`

Get mastery analytics.

### Response

```json
{
  "averageMastery": 0.72,
  "strongestTopics": [],
  "weakestTopics": []
}
```

---

## POST `/mastery`

Update mastery score.

Usually called internally by:

* AI grading
* quiz engine
* lesson completion
* exam results

### Request Body

```json
{
  "studentId": "student_uuid",
  "classId": "class_uuid",
  "topic": "Integral",
  "masteryScore": 0.75
}
```

---

## POST `/mastery/bulk`

Bulk update mastery scores.

### Request Body

```json
{
  "items": [
    {
      "studentId": "uuid",
      "classId": "uuid",
      "topic": "Integral",
      "masteryScore": 0.7
    }
  ]
}
```

---

## GET `/mastery/risk-students`

Get students at learning risk.

### Response

```json
{
  "students": [
    {
      "studentId": "uuid",
      "riskLevel": "high",
      "weakTopics": [
        "Integral"
      ]
    }
  ]
}
```

---

# Validation Rules

| Field        | Validation       |
| ------------ | ---------------- |
| lessonId     | UUID             |
| roadmapId    | UUID             |
| materialId   | UUID             |
| title        | min 2 chars      |
| masteryScore | 0 → 1            |
| orderNo      | positive integer |
| file size    | max configurable |

---

# Authorization Rules

| API              | Teacher     | Student  |
| ---------------- | ----------- | -------- |
| Upload Material  | ✅           | ❌        |
| Delete Material  | Owner only  | ❌        |
| Reindex Material | Owner only  | ❌        |
| Generate Roadmap | ❌           | ✅        |
| View Own Roadmap | ❌           | ✅        |
| Update Mastery   | System only | ❌        |
| View Mastery     | ✅           | Own only |

---

# Suggested Background Jobs

| Job                    | Purpose                 |
| ---------------------- | ----------------------- |
| material_ingest        | parse uploaded files    |
| material_chunking      | split chunks            |
| rag_embedding          | generate embeddings     |
| vector_index_sync      | sync vector db          |
| ai_roadmap_generation  | generate roadmap        |
| mastery_analysis       | calculate mastery       |
| recommendation_refresh | refresh recommendations |

---

# Suggested Future Expansion

## Adaptive Quiz APIs

```txt
POST /adaptive-quizzes/generate
```

---

## AI Tutor APIs

```txt
POST /tutors/sessions
```

---

## Knowledge Graph APIs

```txt
GET /knowledge-graph/topics
```

---

## Learning Streak APIs

```txt
GET /streaks/me
```
