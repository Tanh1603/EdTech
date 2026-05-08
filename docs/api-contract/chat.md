# Chat Module API Contract

## Base URL

```txt
/api/chat
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

Chat Domain chịu trách nhiệm cho:

- AI tutor chat
- conversation history
- contextual learning support
- classroom AI assistant
- RAG chat
- prompt orchestration
- session management

Domain này hoạt động như conversational layer của hệ thống EdTech AI.

---

# Module Structure

```txt
modules/
└── chat/
    ├── sessions/
    ├── messages/
    ├── rag/
    ├── prompts/
    ├── ai/
    └── shared/
```

---

# Prisma Models

---

## ChatSession

```prisma
model ChatSession {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @map("user_id")
  classId   String?  @map("class_id") @db.Uuid
  title     String?
  createdAt DateTime @default(now()) @map("created_at")

  classroom Classroom?    @relation(fields: [classId], references: [id])
  messages  ChatMessage[]

  @@map("chat_sessions")
}
```

---

## ChatMessage

```prisma
model ChatMessage {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  sessionId String   @map("session_id") @db.Uuid
  role      String
  content   String
  intent    String?
  createdAt DateTime @default(now()) @map("created_at")

  session ChatSession @relation(fields: [sessionId], references: [id])

  @@map("chat_messages")
}
```

---

# Suggested Enums

```prisma
enum ChatRole {
  user
  assistant
  system
}

enum ChatIntent {
  tutoring
  homework_help
  explain_concept
  roadmap_guidance
  recommendation
  exam_support
  material_search
}
```

---

# Sessions APIs

---

## POST `/sessions`

Create chat session.

### Request Body

```json
{
  "classId": "uuid",
  "title": "Calculus Support"
}
```

### Response

```json
{
  "id": "session_uuid",
  "title": "Calculus Support",
  "createdAt": "2026-05-07T10:00:00.000Z"
}
```

---

## GET `/sessions`

Get current user chat sessions.

### Query Params

```txt
classId?: uuid
page?: number
limit?: number
search?: string
```

### Response

```json
{
  "items": [
    {
      "id": "session_uuid",
      "title": "Calculus Support",
      "lastMessage": "Explain derivatives",
      "createdAt": "2026-05-07T10:00:00.000Z"
    }
  ]
}
```

---

## GET `/sessions/:sessionId`

Get session detail.

### Response

```json
{
  "id": "session_uuid",
  "title": "Calculus Support",
  "classId": "class_uuid",
  "createdAt": "2026-05-07T10:00:00.000Z"
}
```

---

## PATCH `/sessions/:sessionId`

Update session title.

### Request Body

```json
{
  "title": "Updated Session"
}
```

---

## DELETE `/sessions/:sessionId`

Delete chat session.

Soft delete recommended.

---

# Messages APIs

---

## GET `/sessions/:sessionId/messages`

Get chat messages.

### Query Params

```txt
page?: number
limit?: number
before?: cursor
```

### Response

```json
{
  "items": [
    {
      "id": "message_uuid",
      "role": "user",
      "content": "Explain derivatives",
      "intent": "tutoring",
      "createdAt": "2026-05-07T10:00:00.000Z"
    }
  ]
}
```

---

## POST `/sessions/:sessionId/messages`

Send user message.

### Request Body

```json
{
  "content": "Explain derivatives in simple words"
}
```

### Response

```json
{
  "userMessage": {
    "id": "message_uuid",
    "role": "user",
    "content": "Explain derivatives in simple words"
  },
  "assistantMessage": {
    "id": "assistant_message_uuid",
    "role": "assistant",
    "content": "A derivative measures..."
  }
}
```

---

## GET `/messages/:messageId`

Get message detail.

---

## DELETE `/messages/:messageId`

Delete message.

---

# Streaming APIs

---

## POST `/sessions/:sessionId/messages/stream`

Streaming AI response using SSE/WebSocket.

### Request Body

```json
{
  "content": "Explain integrals"
}
```

### Response

```txt
event: token
data: "Integral"

event: token
data: "is"

event: done
data: {}
```

---

# AI Tutor APIs

---

## POST `/ai/tutor`

Direct AI tutoring endpoint.

### Request Body

```json
{
  "message": "Explain Newton laws",
  "classId": "uuid"
}
```

### Response

```json
{
  "response": "Newton's first law states..."
}
```

---

## POST `/ai/explain`

Explain concept deeply.

### Request Body

```json
{
  "topic": "Derivative"
}
```

---

## POST `/ai/summarize`

Summarize learning material.

### Request Body

```json
{
  "materialId": "uuid"
}
```

---

## POST `/ai/generate-quiz`

Generate quiz from material.

### Request Body

```json
{
  "materialId": "uuid",
  "difficulty": "medium",
  "count": 10
}
```

---

# RAG APIs

---

## POST `/rag/query`

RAG search with materials context.

### Request Body

```json
{
  "query": "What is integral?",
  "classId": "uuid",
  "topK": 5
}
```

### Response

```json
{
  "matches": [
    {
      "materialId": "uuid",
      "chunkId": "uuid",
      "content": "Integral is...",
      "score": 0.92
    }
  ]
}
```

---

## POST `/rag/chat`

Chat with RAG context.

### Request Body

```json
{
  "sessionId": "uuid",
  "message": "Explain chapter 2"
}
```

### Response

```json
{
  "answer": "Based on chapter 2..."
}
```

---

# Prompt APIs

---

## GET `/prompts/intents`

Get supported AI intents.

### Response

```json
{
  "items": [
    "tutoring",
    "homework_help",
    "exam_support"
  ]
}
```

---

# Analytics APIs

---

## GET `/analytics/sessions/me`

Get user chat analytics.

### Response

```json
{
  "totalSessions": 24,
  "totalMessages": 420,
  "favoriteTopics": [
    "Calculus",
    "Physics"
  ]
}
```

---

## GET `/analytics/classrooms/:classId`

Get classroom AI usage analytics.

### Response

```json
{
  "activeStudents": 42,
  "questionsAsked": 1200
}
```

---

# Validation Rules

| Field     | Validation        |
| ----------| ----------------- |
| sessionId | UUID              |
| classId   | UUID              |
| content   | min 1 char        |
| title     | max 255 chars     |
| role      | valid enum/string |
| topK      | 1 → 20            |

---

# Authorization Rules

| API                  | Teacher | Student |
| -------------------- | -------- | -------- |
| Create Session       | ✅        | ✅        |
| View Own Sessions    | ✅        | ✅        |
| Send Messages        | ✅        | ✅        |
| Delete Session       | Owner    | Owner    |
| RAG Query            | ✅        | ✅        |
| Classroom Analytics  | ✅        | ❌        |

---

# Suggested Background Jobs

| Job                     | Purpose                       |
| ----------------------- | ----------------------------- |
| ai_response_generation  | generate LLM response         |
| rag_context_building    | retrieve vector context       |
| chat_title_generation   | auto generate session title   |
| toxicity_detection      | detect unsafe messages        |
| prompt_logging          | audit prompts                 |
| token_usage_tracking    | track AI token usage          |

---

# Events Published

```txt
chat.session.created
chat.message.sent
chat.ai.response.generated
chat.rag.query.executed
```

---

# Events Consumed

```txt
learning.material.indexed
assessment.result.generated
classroom.student.removed
```

---

# Suggested Future Expansion

## Voice Tutor APIs

```txt
POST /voice/sessions
```

---

## Multi Agent APIs

```txt
POST /agents/orchestrate
```

---

## AI Debate APIs

```txt
POST /debates/start
```

---

## Live Classroom Assistant APIs

```txt
POST /live-assistant/messages
```
