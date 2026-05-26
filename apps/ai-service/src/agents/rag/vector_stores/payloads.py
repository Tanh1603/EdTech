from __future__ import annotations

from typing import Any

from agents.rag.chunking import TextChunk


def chunk_payload(chunk: TextChunk) -> dict[str, Any]:
    return {
        "materialId": chunk.material_id,
        "chunkId": chunk.chunk_id,
        "title": chunk.title,
        "content": chunk.content,
        "orderNo": chunk.order_no,
        "source": "material-text",
    }


def chunk_from_payload(payload: dict[str, Any]) -> TextChunk:
    return TextChunk(
        material_id=str(payload.get("materialId") or ""),
        chunk_id=str(payload.get("chunkId") or ""),
        title=str(payload.get("title") or ""),
        content=str(payload.get("content") or ""),
        order_no=int(payload.get("orderNo") or 0),
    )
