# Learning Module API Contract

## Base URL

```txt
/api/learning
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

Upload learning material.

Supports:

* PDF
* DOCX
* PPTX
* Images
* Video

### Multipart Form Data

```txt
file: url
lessonId: uuid
title: string
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

## POST `/materials/:materialId/reindex`

Regenerate:

* chunks
* embeddings
* vector index
* semantic search index

### Request Body

```json
{
  "force": true,
  "chunkSize": 500,
  "chunkOverlap": 100
}
```

### Response

```json
{
  "materialId": "material_uuid",
  "status": "indexing",
  "jobId": "job_uuid"
}
```

---

## GET `/materials/:materialId/jobs`

Get indexing jobs history.

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

## POST `/materials/search`

Semantic search materials using vector search.

### Request Body

```json
{
  "query": "integral formulas",
  "lessonId": "uuid",
  "topK": 5
}
```

### Response

```json
{
  "matches": [
    {
      "chunkId": "chunk_uuid",
      "content": "Integral is ...",
      "score": 0.92
    }
  ]
}
```

---

# Roadmaps APIs

## POST `/roadmaps/generate`

Generate AI roadmap.

### Request Body

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

### Response

```json
{
  "roadmapId": "roadmap_uuid",
  "generatedByAi": true,
  "status": "generating"
}
```

---

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

# Recommendations APIs

## GET `/recommendations`

Get AI recommendations.

### Query Params

```txt
classId?: uuid
```

### Response

```json
{
  "weakTopics": [
    "Integral"
  ],
  "recommendedLessons": [],
  "recommendedMaterials": [],
  "recommendedExercises": [],
  "recommendedRoadmaps": []
}
```

---

## GET `/recommendations/lessons`

Get recommended lessons only.

---

## GET `/recommendations/materials`

Get recommended materials only.

---

## GET `/recommendations/topics`

Get weak topics analysis.

---

## GET `/recommendations/next-learning`

Get recommended next learning action.

### Response

```json
{
  "type": "lesson",
  "lessonId": "uuid",
  "title": "Integral Basics"
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
