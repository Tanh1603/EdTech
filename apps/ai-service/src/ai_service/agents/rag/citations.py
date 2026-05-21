from typing import Any

from ai_service.agents.rag.chunking import TextChunk


def citation_for(chunk: TextChunk) -> dict[str, Any]:
    return {
        "materialId": chunk.material_id,
        "chunkId": chunk.chunk_id,
        "title": chunk.title,
        "orderNo": chunk.order_no,
        "source": {"type": "text-fixture"},
    }
