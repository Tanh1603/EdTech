from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from agents.rag.chunking import TextChunk


@dataclass(frozen=True)
class VectorRecord:
    chunk: TextChunk
    vector: list[float]


class VectorStore(Protocol):
    def upsert(self, chunk: TextChunk, vector: list[float]) -> None: ...

    def upsert_many(self, records: list[tuple[TextChunk, list[float]]]) -> None: ...

    def search(
        self,
        query_vector: list[float],
        top_k: int = 5,
        material_id: str | None = None,
    ) -> list[tuple[TextChunk, float]]: ...

    def material_chunks(self, material_id: str, limit: int = 24) -> list[TextChunk]: ...

    def delete_material(self, material_id: str) -> None: ...


def dot(left: list[float], right: list[float]) -> float:
    return sum(a * b for a, b in zip(left, right, strict=False))
