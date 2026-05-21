# Phase 10: Material Ingestion Worker

## Goal

Implement the material ingestion workflow from BE Core material metadata to
parsed chunks, embeddings, vector upsert, and status updates.

## Implementation

- Load material metadata by ID from BE Core.
- Keep material ingestion code under `ai_service/agents/workers`.
- Download/read content through a fixture storage adapter first.
- Parse, chunk, embed, and upsert vectors.
- Update BE Core with chunks, citations, material status, and job status.
- Add Cloudinary or signed URL storage adapters after the local fixture path is
  stable.

## Acceptance

- Deterministic fixture material creates expected chunks and citations.
- Vector upsert receives expected payload metadata.
- Failure marks the job failed with structured error details.
- File bytes are never sent over gRPC.

## References

- [Qdrant quickstart](https://qdrant.tech/documentation/quick-start/)
- [Docker Compose services](https://docs.docker.com/reference/compose-file/services/)
