# Phase 10: AssessmentMaterialAgent Material Ingestion

## Goal

Implement the `AssessmentMaterialAgent` material ingestion workflow from BE Core
material metadata to parsed chunks, embeddings, vector upsert, and status
updates. Material ingestion belongs to this profile because quiz/exam generation
and grading depend on RAG-ready material.

## Implementation

- Load material metadata by ID from BE Core.
- Keep material ingestion code under `apps/ai-service/src/agents/workers`.
- Download/read content through direct storage URL first, then BE Core signed
  access when storage returns 401/403.
- Parse, chunk with a larger token budget, embed, and upsert vectors in batches.
- Update BE Core with chunk manifest/preview metadata, material status, and job
  status.
- Delete existing Qdrant points for the material before fresh upsert.
- Do not send full chunk text through BE Core gRPC; Qdrant payload owns full
  chunk text for retrieval.
- Keep Cloudinary credentials in BE Core; AI Service resolves access through BE
  Core when direct download is not public.
- Expose the workflow as an `AssessmentMaterialAgent` capability in the shared
  LangGraph runtime later, while keeping the worker process as the async
  execution mechanism.

## Acceptance

- Deterministic material ingest creates expected manifest rows, Qdrant points,
  and citations.
- Vector upsert receives expected payload metadata.
- BE Core `material_chunks` rows are manifest/preview records, not full text
  duplicates.
- Re-ingest leaves no stale Qdrant points for the material.
- Failure marks the job failed with structured error details.
- File bytes are never sent over gRPC.

## References

- [Qdrant quickstart](https://qdrant.tech/documentation/quick-start/)
- [Docker Compose services](https://docs.docker.com/reference/compose-file/services/)
