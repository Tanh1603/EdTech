# AI Service Research Notes

These notes define the design choices behind the V1 AI Service. They are
practical constraints for implementation, not a literature survey.

## Agent Pattern

V1 should use a small orchestrator with explicit states:

```txt
receive request -> load context -> plan -> select tools -> execute tools
  -> call model -> validate output -> persist result -> return/stream response
```

Planner, reasoner, and tool selector should be separate components because they
change at different speeds:

- Planner decides the steps needed for a user/job request.
- Reasoner composes domain context, retrieval results, and prompt constraints.
- Tool selector chooses typed tools and records audit metadata.

Use LangGraph only when the workflow needs complex branching, retries,
interrupts, or long-lived state graphs. A custom state machine is lower-risk for
the first material ingestion, chat, grading, and roadmap flows.

## RAG Design

Material RAG should be built around BE Core material IDs and Qdrant vector
payloads.

Chunking defaults:

- Chunk by document structure first, then token budget.
- Preserve `materialId`, `lessonId`, `courseId`, `classId`, `chunkId`,
  `orderNo`, source page/slide, checksum, and token count.
- Store chunk metadata in BE Core and vectors in Qdrant.

Retrieval defaults:

- Start with top-k semantic search.
- Add reranking only after fixtures show precision problems.
- Every generated answer that uses material context should include citation
  references to known chunk IDs.

Qdrant payload example:

```json
{
  "materialId": "uuid",
  "lessonId": "uuid",
  "courseId": "uuid",
  "classId": "uuid",
  "chunkId": "uuid",
  "orderNo": 1,
  "source": {"page": 3}
}
```

## Memory Design

| Memory | Store | Rule |
| --- | --- | --- |
| Request metadata | gRPC metadata | Single request/job only. |
| Interactive scratchpad | Redis | Minutes to hours; safe to recompute. |
| Chat history | BE Core PostgreSQL | Durable and user-visible. |
| Retrieval memory | Qdrant + BE Core chunks | Durable semantic context. |
| Policy memory | Versioned prompt/config files | Reviewed with code. |

Redis must not be the only store for user-visible conversation history or final
AI outputs.

## Tool Calling And MCP

V1 should implement a local typed tool registry first:

- BE Core tools for courses, classes, lessons, materials, chat, assessments,
  jobs, and mastery.
- Retrieval tools for Qdrant search and citation assembly.
- Storage tools for signed URL or provider download.
- Job tools for publishing/updating async work.

MCP can wrap the same tool contracts later. Tool calls must be policy-checked,
logged, and scoped by delegated user/job metadata.

## Evaluation

Default tests should be deterministic:

- Fake LLM provider returns fixture responses.
- Fake embedding provider returns stable vectors.
- RAG tests assert citations point to known fixture chunks.
- Grading tests use rubric fixtures and stable model output.
- Token/latency metrics are asserted as structured records, not provider bills.

Use provider-backed evaluation only in opt-in test jobs with explicit secrets.

## Security

- LLM and embedding API keys live only in AI Service.
- Gateway and BE Core must never receive provider secrets.
- AI Service must not bypass BE Core authorization by reading/writing LMS tables
  directly.
- Full prompt logging is off by default; enable only in controlled audit mode.
- Internal calls require `x-service-token` outside local development, with mTLS
  as a later production hardening step.
