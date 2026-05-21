from ai_service.agents.providers.embedding_provider import EmbeddingProvider
from ai_service.agents.rag.chunking import TextChunk
from ai_service.agents.rag.vector_store import FakeVectorStore


class EmbeddingIndexer:
    def __init__(self, provider: EmbeddingProvider, vector_store: FakeVectorStore) -> None:
        self.provider = provider
        self.vector_store = vector_store

    def index(self, chunks: list[TextChunk]) -> None:
        for chunk in chunks:
            self.vector_store.upsert(chunk, self.provider.embed(chunk.content))
