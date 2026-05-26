from __future__ import annotations

from dataclasses import dataclass, field

from agents.rag.chunking import TextChunk

from .base import VectorRecord, dot


@dataclass
class InMemoryVectorStore:
    records: list[VectorRecord] = field(default_factory=list)

    def upsert(self, chunk: TextChunk, vector: list[float]) -> None:
        self.records = [
            record for record in self.records if record.chunk.chunk_id != chunk.chunk_id
        ]
        self.records.append(VectorRecord(chunk=chunk, vector=vector))

    def upsert_many(self, records: list[tuple[TextChunk, list[float]]]) -> None:
        for chunk, vector in records:
            self.upsert(chunk, vector)

    def search(
        self,
        query_vector: list[float],
        top_k: int = 5,
        material_id: str | None = None,
    ) -> list[tuple[TextChunk, float]]:
        ranked = sorted(
            (
                (record.chunk, dot(query_vector, record.vector))
                for record in self.records
                if material_id is None or record.chunk.material_id == material_id
            ),
            key=lambda item: item[1],
            reverse=True,
        )
        return ranked[:top_k]

    def material_chunks(self, material_id: str, limit: int = 24) -> list[TextChunk]:
        return sorted(
            (record.chunk for record in self.records if record.chunk.material_id == material_id),
            key=lambda chunk: chunk.order_no,
        )[:limit]

    def delete_material(self, material_id: str) -> None:
        self.records = [
            record for record in self.records if record.chunk.material_id != material_id
        ]
