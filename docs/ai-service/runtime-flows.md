# AI Service Runtime Flows

## AssessmentMaterialAgent Material Ingestion

```mermaid
sequenceDiagram
  participant C as Client
  participant G as API Gateway
  participant S as Object Storage
  participant B as BE Core
  participant R as RabbitMQ
  participant W as AssessmentMaterialAgent Worker
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
  W->>W: Parse and chunk with larger chunk size
  W->>B: gRPC clear/write chunk manifest
  W->>Q: Delete material points, then upsert fresh vectors
  W->>B: gRPC mark material ready + job succeeded
```

Rules:

- BE Core creates the job record before publishing to RabbitMQ.
- AI Worker acknowledges the message only after BE Core/Qdrant writes succeed.
- File bytes are never sent through gRPC.
- Material ingestion belongs to `AssessmentMaterialAgent` because quiz/exam
  generation and grading depend on RAG-ready source material.

## TutorAgent RAG Chat

```mermaid
sequenceDiagram
  participant C as Client
  participant G as API Gateway
  participant B as BE Core
  participant A as TutorAgent
  participant Q as Qdrant
  participant L as LLM Provider

  C->>G: POST /api/chat/sessions/:id/messages
  G->>B: gRPC CreateMessage
  B->>B: Validate session/class access
  B->>A: gRPC GenerateChatResponse(sessionId,messageId)
  A->>B: gRPC read session/material/class context
  A->>A: sanitize history + detect intent
  A->>A: rewrite follow-up query if needed
  A->>Q: ordered summary retrieval or semantic QA retrieval
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

TutorAgent retrieval modes:

- `summary_material`: no vector search; read ordered chunks by `materialId`.
- `qa_material`: semantic Qdrant search with score threshold.
- `follow_up`: rewrite to a standalone question, then semantic search.
- `general_tutor`: answer without forced citations when no material context is
  present.

TutorAgent structured log steps:

- `context.load`
- `memory.load`
- `intent.detected`
- `query.rewritten`
- `retrieval.summary`
- `retrieval.semantic`
- `prompt.built`
- `model.stream`
- `response.sanitized`
- `persistence.saved`

## AssessmentMaterialAgent Grading

```mermaid
sequenceDiagram
  participant C as Client
  participant G as API Gateway
  participant B as BE Core
  participant R as RabbitMQ
  participant W as AssessmentMaterialAgent Worker
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
- Provider-backed grading smoke checks run only when local Groq/Ollama config is
  available.

## LearningPathAgent Roadmap And Recommendation

```mermaid
sequenceDiagram
  participant B as BE Core
  participant R as RabbitMQ
  participant W as LearningPathAgent Worker
  participant A as LangGraph Runtime

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
- Roadmap generation and recommendation are one profile:
  `LearningPathAgent`.
