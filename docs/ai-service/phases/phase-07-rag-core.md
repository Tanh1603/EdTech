# Phase 07: RAG Core

## Goal

Build the core retrieval augmented generation pipeline around material IDs,
chunks, embeddings, retrieval, and citations.

## Implementation

- Implement RAG modules under `apps/ai-service/src/agents/rag`: `parsers.py`,
  `chunking.py`, `embeddings.py`, `vector_store.py`, `retrieval.py`, and
  `citations.py`.
- Start with text fixtures in V1.
- Add PDF, DOCX, and PPTX parsing only after the text pipeline is stable.
- Use `qdrant-client` for the real vector store adapter.
- Keep `InMemoryVectorStore` only for offline smoke checks and dependency
  injection.
- Make `AiRagService.SearchMaterialContext` return chunks, metadata, and
  citation refs.

## Acceptance

- Fixture text parses into deterministic chunks.
- Provider-backed embeddings and Qdrant vector search return known `chunkId`
  values in local smoke checks.
- Search responses include citation metadata tied to material chunks.
- `docker compose up -d qdrant` starts the local vector store.

## References

- [RAG paper](https://arxiv.org/abs/2005.11401)
- [Self-RAG paper](https://arxiv.org/abs/2310.11511)
- [Qdrant interfaces](https://qdrant.tech/documentation/interfaces/)
- [Qdrant Python client](https://python-client.qdrant.tech/)
