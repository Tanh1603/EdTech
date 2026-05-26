import logging

from agents.providers.embedding_provider import EmbeddingProvider
from agents.rag.chunking import TextChunk

from .vector_stores import VectorStore

logger = logging.getLogger(__name__)


class EmbeddingIndexer:
    def __init__(
        self,
        provider: EmbeddingProvider,
        vector_store: VectorStore,
        batch_size: int = 32,
    ) -> None:
        self.provider = provider
        self.vector_store = vector_store
        self.batch_size = max(1, batch_size)

    def index(self, chunks: list[TextChunk]) -> None:
        for batch_index, offset in enumerate(range(0, len(chunks), self.batch_size), start=1):
            batch = chunks[offset : offset + self.batch_size]
            vectors = self.provider.embed_many([chunk.content for chunk in batch])
            logger.info(
                "Chunks embedded",
                extra={
                    "component": "embedding_indexer",
                    "step": "embed.batch.ok",
                    "materialId": batch[0].material_id if batch else "",
                    "batchIndex": batch_index,
                    "batchSize": len(batch),
                    "totalChunks": len(chunks),
                    "vectorSize": len(vectors[0]) if vectors else 0,
                },
            )
            self.vector_store.upsert_many(list(zip(batch, vectors, strict=True)))
