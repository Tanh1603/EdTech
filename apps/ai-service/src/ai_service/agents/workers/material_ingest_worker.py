from ai_service.agents.providers.embedding_provider import FakeEmbeddingProvider
from ai_service.agents.rag.chunking import SimpleChunker
from ai_service.agents.rag.embeddings import EmbeddingIndexer
from ai_service.agents.rag.parsers import TextParser
from ai_service.agents.rag.vector_store import FakeVectorStore
from ai_service.agents.workers.worker import JobMessage


class MaterialIngestWorker:
    def __init__(self, vector_store: FakeVectorStore | None = None) -> None:
        self.parser = TextParser()
        self.chunker = SimpleChunker(max_words=80)
        self.vector_store = vector_store or FakeVectorStore()
        self.indexer = EmbeddingIndexer(FakeEmbeddingProvider(), self.vector_store)

    def handle(self, message: JobMessage) -> dict[str, object]:
        title = str(message.payload.get("title") or message.resource_id)
        content = str(message.payload.get("content") or "")
        document = self.parser.parse(message.resource_id, title, content)
        chunks = self.chunker.chunk(document)
        self.indexer.index(chunks)
        return {"materialId": message.resource_id, "chunkCount": len(chunks)}
