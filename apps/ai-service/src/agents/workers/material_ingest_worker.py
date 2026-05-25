from hashlib import sha256

from agents.clients.be_core import BeCoreCallContext, BeCoreGrpcClient
from agents.providers.embedding_provider import EmbeddingProvider
from agents.providers.factory import create_embedding_provider
from agents.rag.chunking import SimpleChunker
from agents.rag.embeddings import EmbeddingIndexer
from agents.rag.factory import create_vector_store
from agents.rag.parsers import DocumentParser
from agents.rag.vector_store import VectorStore
from agents.workers.storage import MaterialContentLoader
from agents.workers.worker import JobMessage


class MaterialIngestWorker:
    def __init__(
        self,
        be_core: BeCoreGrpcClient | None = None,
        vector_store: VectorStore | None = None,
        embedding_provider: EmbeddingProvider | None = None,
        content_loader: MaterialContentLoader | None = None,
    ) -> None:
        self.be_core = be_core
        self.parser = DocumentParser()
        self.content_loader = content_loader or MaterialContentLoader()
        self.chunker = SimpleChunker(max_words=80)
        self.vector_store = vector_store or create_vector_store()
        self.indexer = EmbeddingIndexer(
            embedding_provider or create_embedding_provider(),
            self.vector_store,
        )

    def handle(self, message: JobMessage) -> dict[str, object]:
        material_id = message.resource_id
        try:
            context = _context_from_message(message)
            if self.be_core:
                self.be_core.update_material_status(material_id, "indexing")
            material = (
                self.be_core.get_material(material_id, context)
                if self.be_core and context.user_id
                else dict(message.payload)
            )
            title = str(material.get("title") or message.payload.get("title") or material_id)
            storage_content = self.content_loader.load(material, message.payload)
            document = self.parser.parse_bytes(
                material_id,
                title,
                storage_content.content,
                mime_type=storage_content.mime_type,
                filename=storage_content.filename,
            )
            chunks = self.chunker.chunk(document)
            self.indexer.index(chunks)
            chunk_rows = [
                {
                    "chunkId": chunk.chunk_id,
                    "content": chunk.content,
                    "orderNo": chunk.order_no,
                    "tokenCount": len(chunk.content.split()),
                    "embeddingId": chunk.chunk_id,
                    "checksum": sha256(chunk.content.encode("utf-8")).hexdigest(),
                }
                for chunk in chunks
            ]
            if self.be_core:
                self.be_core.replace_material_chunks(material_id, chunk_rows)
                self.be_core.update_material_status(material_id, "ready")
            return {"materialId": material_id, "chunkCount": len(chunks)}
        except Exception as error:
            if self.be_core:
                self.be_core.update_material_status(
                    material_id,
                    "failed",
                    {"message": str(error)},
                )
            raise


def _context_from_message(message: JobMessage) -> BeCoreCallContext:
    user_id = (
        message.payload.get("requestedBy")
        or message.payload.get("createdBy")
        or message.payload.get("userId")
        or message.payload.get("user_id")
        or ""
    )
    return BeCoreCallContext(
        request_id=message.request_id,
        correlation_id=message.correlation_id,
        user_id=str(user_id) if user_id else None,
        roles=("admin",),
        job_id=message.job_id,
    )
