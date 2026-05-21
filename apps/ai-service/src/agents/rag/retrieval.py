from dataclasses import dataclass
from typing import Any

from agents.providers.embedding_provider import EmbeddingProvider
from agents.rag.citations import citation_for
from agents.rag.vector_store import FakeVectorStore


@dataclass(frozen=True)
class RetrievalResult:
    chunk_id: str
    content: str
    score: float
    citation: dict[str, Any]


class Retriever:
    def __init__(
        self, provider: EmbeddingProvider, vector_store: FakeVectorStore
    ) -> None:
        self.provider = provider
        self.vector_store = vector_store

    def search(self, query: str, top_k: int = 5) -> list[RetrievalResult]:
        query_vector = self.provider.embed(query)
        return [
            RetrievalResult(
                chunk_id=chunk.chunk_id,
                content=chunk.content,
                score=score,
                citation=citation_for(chunk),
            )
            for chunk, score in self.vector_store.search(query_vector, top_k)
        ]
