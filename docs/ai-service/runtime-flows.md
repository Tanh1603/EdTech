# AI Service Runtime Flows

## Material Ingestion

```mermaid
sequenceDiagram
  participant C as Client
  participant G as API Gateway
  participant S as Object Storage
  participant B as BE Core
  participant R as RabbitMQ
  participant W as AI Worker
  participant Q as Qdrant

  C->>G: POST /api/storage/upload multipart
  G->>S: Upload bytes
  S-->>G: storageUrl/publicId/mimeType/size
  C->>G: POST /api/learning/materials metadata
  G->>B: gRPC CreateMaterial
  B-->>G: Material status=uploaded/indexing
  B->>R: Publish edtech.ai.material.ingest
  W->>R: Consume job
  W->>B: gRPC GetMaterialDetail
  W->>S: Download by storageUrl/signed URL
  W->>W: Parse, chunk, embed
  W->>B: gRPC upsert chunks/status
  W->>Q: Upsert vectors
  W->>B: gRPC mark material ready + job succeeded
```

Rules:

- BE Core creates the job record before publishing to RabbitMQ.
- AI Worker acknowledges the message only after BE Core/Qdrant writes succeed.
- File bytes are never sent through gRPC.

## RAG Chat

```mermaid
sequenceDiagram
  participant C as Client
  participant G as API Gateway
  participant B as BE Core
  participant A as AI Service
  participant Q as Qdrant
  participant L as LLM Provider

  C->>G: POST /api/chat/sessions/:id/messages
  G->>B: gRPC CreateMessage
  B->>B: Validate session/class access
  B->>A: gRPC GenerateChatResponse(sessionId,messageId)
  A->>B: gRPC read session/material/class context
  A->>Q: Search material chunks
  A->>L: Generate answer with citations
  A->>B: gRPC AppendAssistantMessage
  B-->>G: Message result
  G-->>C: Response envelope
```

Streaming variant:

```txt
Client SSE -> Gateway -> AiOrchestratorService.StreamChatResponse
```

AI Service streams tokens internally with gRPC server streaming; Gateway converts
the stream to browser-facing SSE events.

## Assessment Grading

```mermaid
sequenceDiagram
  participant C as Client
  participant G as API Gateway
  participant B as BE Core
  participant R as RabbitMQ
  participant W as Grading Worker
  participant L as LLM Provider

  C->>G: POST /api/assessments/submissions/:id/submit
  G->>B: gRPC SubmitSubmission
  B->>B: Persist submitted answers
  B->>R: Publish edtech.ai.assessment.grade
  B-->>G: Submission accepted/job status
  W->>R: Consume grading job
  W->>B: gRPC read submission/questions/rubric
  W->>L: Grade and explain feedback
  W->>B: gRPC UpsertAiResult + UpdateSubmissionStatus
```

Rules:

- The worker writes grades through BE Core.
- Rubric and question context are loaded by ID.
- CI uses a deterministic fake grading provider.

## Roadmap Generation

```mermaid
sequenceDiagram
  participant B as BE Core
  participant R as RabbitMQ
  participant W as Roadmap Worker
  participant A as Orchestrator

  B->>R: Publish edtech.ai.roadmap.generate
  W->>R: Consume job
  W->>B: gRPC read mastery/progress/context
  W->>A: Generate plan
  A-->>W: Roadmap draft
  W->>B: gRPC create roadmap/items
  W->>B: gRPC mark job succeeded
```

Rules:

- Roadmaps are persisted by BE Core.
- AI Service produces drafts and recommendations only.
- Mastery and progress analytics stay BE-owned.
