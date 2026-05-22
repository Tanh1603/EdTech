# Phase 10: AssessmentMaterialAgent Material Ingestion

## Goal

Implement the `AssessmentMaterialAgent` material ingestion workflow from BE Core
material metadata to parsed chunks, embeddings, vector upsert, and status
updates. Material ingestion belongs to this profile because quiz/exam generation
and grading depend on RAG-ready material.

## Implementation

- Load material metadata by ID from BE Core.
- Keep material ingestion code under `apps/ai-service/src/agents/workers`.
- Download/read content through a fixture storage adapter first.
- Parse, chunk, embed, and upsert vectors.
- Update BE Core with chunks, citations, material status, and job status.
- Add Cloudinary or signed URL storage adapters after the local fixture path is
  stable.
- Expose the workflow as an `AssessmentMaterialAgent` capability in the shared
  LangGraph runtime later, while keeping the worker process as the async
  execution mechanism.

## Acceptance

- Deterministic fixture material creates expected chunks and citations.
- Vector upsert receives expected payload metadata.
- Failure marks the job failed with structured error details.
- File bytes are never sent over gRPC.

## References

- [Qdrant quickstart](https://qdrant.tech/documentation/quick-start/)
- [Docker Compose services](https://docs.docker.com/reference/compose-file/services/)
