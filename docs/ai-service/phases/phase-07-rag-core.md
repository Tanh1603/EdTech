# Phase 07: RAG Core

## Goal

Build the core retrieval augmented generation pipeline around material IDs,
chunks, embeddings, retrieval, and citations.

## Implementation

- Implement RAG modules under `ai_service/agents/rag`: `parsers.py`,
  `chunking.py`, `embeddings.py`, `vector_store.py`, `retrieval.py`, and
  `citations.py`.
- Start with text fixtures in V1.
- Add PDF, DOCX, and PPTX parsing only after the text pipeline is stable.
- Provide a fake Qdrant/vector implementation for offline verification.
- Make `AiRagService.SearchMaterialContext` return chunks, metadata, and
  citation refs.

## Acceptance

- Fixture text parses into deterministic chunks.
- Fake embeddings and fake vector search return known `chunkId` values.
- Search responses include citation metadata tied to material chunks.

## References

- [RAG paper](https://arxiv.org/abs/2005.11401)
- [Self-RAG paper](https://arxiv.org/abs/2310.11511)
- [Qdrant interfaces](https://qdrant.tech/documentation/interfaces/)
- [Qdrant Python client](https://python-client.qdrant.tech/)
