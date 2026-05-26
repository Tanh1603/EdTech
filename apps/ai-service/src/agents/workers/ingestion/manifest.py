from __future__ import annotations

from hashlib import sha256

from agents.rag.chunking import TextChunk


def chunk_manifest_rows(
    material_id: str,
    chunks: list[TextChunk],
    mime_type: str | None = None,
    filename: str | None = None,
) -> list[dict[str, object]]:
    return [
        {
            "chunkId": chunk.chunk_id,
            "content": preview(chunk.content),
            "preview": preview(chunk.content),
            "orderNo": chunk.order_no,
            "tokenCount": len(chunk.content.split()),
            "embeddingId": chunk.chunk_id,
            "checksum": sha256(chunk.content.encode("utf-8")).hexdigest(),
            "storageKey": f"qdrant://{material_id}/{chunk.chunk_id}",
            "pageNo": 0,
            "source": {
                "type": "material-text",
                "mimeType": mime_type or "",
                "filename": filename or "",
            },
        }
        for chunk in chunks
    ]


def batches(rows: list[dict[str, object]], batch_size: int) -> list[list[dict[str, object]]]:
    size = max(1, batch_size)
    return [rows[index : index + size] for index in range(0, len(rows), size)]


def preview(content: str, max_chars: int = 500) -> str:
    return content[:max_chars].strip()
