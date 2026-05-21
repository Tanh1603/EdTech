from dataclasses import dataclass, field

from ai_service.agents.rag.chunking import TextChunk


@dataclass(frozen=True)
class VectorRecord:
    chunk: TextChunk
    vector: list[float]


def dot(left: list[float], right: list[float]) -> float:
    return sum(a * b for a, b in zip(left, right, strict=False))


@dataclass
class FakeVectorStore:
    records: list[VectorRecord] = field(default_factory=list)

    def upsert(self, chunk: TextChunk, vector: list[float]) -> None:
        self.records = [
            record for record in self.records if record.chunk.chunk_id != chunk.chunk_id
        ]
        self.records.append(VectorRecord(chunk=chunk, vector=vector))

    def search(self, query_vector: list[float], top_k: int = 5) -> list[tuple[TextChunk, float]]:
        ranked = sorted(
            ((record.chunk, dot(query_vector, record.vector)) for record in self.records),
            key=lambda item: item[1],
            reverse=True,
        )
        return ranked[:top_k]
