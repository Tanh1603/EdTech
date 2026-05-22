from agents.providers.embedding_provider import EmbeddingProvider
from agents.providers.factory import create_embedding_provider
from agents.rag.chunking import SimpleChunker
from agents.rag.embeddings import EmbeddingIndexer
from agents.rag.factory import create_vector_store
from agents.rag.parsers import TextParser
from agents.rag.vector_store import VectorStore
from agents.workers.worker import JobMessage


class MaterialIngestWorker:
    def __init__(
        self,
        vector_store: VectorStore | None = None,
        embedding_provider: EmbeddingProvider | None = None,
    ) -> None:
        self.parser = TextParser()
        self.chunker = SimpleChunker(max_words=80)
        self.vector_store = vector_store or create_vector_store()
        self.indexer = EmbeddingIndexer(
            embedding_provider or create_embedding_provider(),
            self.vector_store,
        )

    def handle(self, message: JobMessage) -> dict[str, object]:
        title = str(message.payload.get("title") or message.resource_id)
        content = str(message.payload.get("content") or "")
        document = self.parser.parse(message.resource_id, title, content)
        chunks = self.chunker.chunk(document)
        self.indexer.index(chunks)
        return {"materialId": message.resource_id, "chunkCount": len(chunks)}
