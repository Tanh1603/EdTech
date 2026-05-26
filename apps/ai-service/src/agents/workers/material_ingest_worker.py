import logging
from hashlib import sha256
from time import perf_counter

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
from config.settings import Settings, get_settings

logger = logging.getLogger(__name__)


class MaterialIngestWorker:
    def __init__(
        self,
        be_core: BeCoreGrpcClient | None = None,
        vector_store: VectorStore | None = None,
        embedding_provider: EmbeddingProvider | None = None,
        content_loader: MaterialContentLoader | None = None,
        settings: Settings | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.be_core = be_core
        self.parser = DocumentParser()
        self.content_loader = content_loader or MaterialContentLoader(self._resolve_file_access)
        self.chunker = SimpleChunker(max_words=260)
        self.vector_store = vector_store or create_vector_store()
        self.indexer = EmbeddingIndexer(
            embedding_provider or create_embedding_provider(),
            self.vector_store,
            batch_size=self.settings.embedding_batch_size,
        )

    def _resolve_file_access(
        self,
        material: dict[str, object],
        payload: dict[str, object],
    ) -> dict[str, str]:
        if not self.be_core:
            return {}
        material_id = _material_id(material, payload)
        public_id = _public_id(material, payload)
        logger.info(
            "Resolving material file access through BE Core",
            extra={
                "component": "material_ingest_worker",
                "step": "storage.resolve_access",
                "materialId": material_id or "",
            },
        )
        return self.be_core.resolve_file_access(
            material_id=material_id,
            public_id=public_id,
        )

    def handle(self, message: JobMessage) -> dict[str, object]:
        material_id = message.resource_id
        if not material_id:
            raise ValueError("Material ingest job requires materialId/resourceId")
        started = perf_counter()
        try:
            context = _context_from_message(message)
            logger.info(
                "Material ingest started",
                extra=_log_extra(message, "ingest.started"),
            )
            if self.be_core:
                logger.info(
                    "Updating material status to indexing",
                    extra=_log_extra(message, "material.status.indexing"),
                )
                self.be_core.update_material_status(material_id, "indexing")
            material = (
                self.be_core.get_material(material_id, context)
                if self.be_core and context.user_id
                else dict(message.payload)
            )
            logger.info(
                "Material metadata loaded",
                extra={
                    **_log_extra(message, "material.fetch"),
                    "status": "be_core" if self.be_core and context.user_id else "payload",
                },
            )
            title = str(material.get("title") or message.payload.get("title") or material_id)
            storage_content = self.content_loader.load(material, message.payload)
            logger.info(
                "Material content downloaded",
                extra={
                    **_log_extra(message, "download.ok"),
                    "byteSize": len(storage_content.content),
                    "status": storage_content.mime_type or "",
                },
            )
            document = self.parser.parse_bytes(
                material_id,
                title,
                storage_content.content,
                mime_type=storage_content.mime_type,
                filename=storage_content.filename,
            )
            logger.info(
                "Material content parsed",
                extra={
                    **_log_extra(message, "parse.ok"),
                    "textLength": len(document.text),
                },
            )
            chunks = self.chunker.chunk(document)
            if not chunks:
                raise ValueError("No text chunks extracted from material")
            logger.info(
                "Material content chunked",
                extra={**_log_extra(message, "chunk.ok"), "chunkCount": len(chunks)},
            )
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
                logger.info(
                    "Clearing material chunks in BE Core",
                    extra={
                        **_log_extra(message, "be_core.clear_chunks"),
                    },
                )
                self.be_core.clear_material_chunks(material_id)
                logger.info(
                    "Material chunks cleared in BE Core",
                    extra=_log_extra(message, "be_core.clear_chunks.ok"),
                )
                for batch_index, batch in enumerate(
                    _batches(chunk_rows, self.settings.material_chunk_write_batch_size),
                    start=1,
                ):
                    logger.info(
                        "Appending material chunks to BE Core",
                        extra={
                            **_log_extra(message, "be_core.append_chunks"),
                            "batchIndex": batch_index,
                            "batchSize": len(batch),
                            "totalChunks": len(chunk_rows),
                        },
                    )
                    self.be_core.append_material_chunks(material_id, batch)
                logger.info(
                    "Material chunks written to BE Core",
                    extra={
                        **_log_extra(message, "be_core.append_chunks.ok"),
                        "chunkCount": len(chunks),
                    },
                )
            self.indexer.index(chunks)
            logger.info(
                "Material chunks embedded and upserted",
                extra={**_log_extra(message, "qdrant.upsert.ok"), "chunkCount": len(chunks)},
            )
            if self.be_core:
                self.be_core.update_material_status(material_id, "ready")
            duration_ms = round((perf_counter() - started) * 1000)
            logger.info(
                "Material ingest succeeded",
                extra={
                    **_log_extra(message, "ingest.succeeded"),
                    "chunkCount": len(chunks),
                    "durationMs": duration_ms,
                },
            )
            return {"materialId": material_id, "chunkCount": len(chunks)}
        except Exception as error:
            logger.exception(
                "Material ingest failed",
                extra={
                    **_log_extra(message, "ingest.failed"),
                    "durationMs": round((perf_counter() - started) * 1000),
                },
            )
            if self.be_core:
                try:
                    self.be_core.update_material_status(
                        material_id,
                        "failed",
                        {"message": str(error)},
                    )
                except Exception:
                    logger.exception(
                        "Failed to update material failed status",
                        extra=_log_extra(message, "material.status.failed_error"),
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


def _material_id(material: dict[str, object], payload: dict[str, object]) -> str | None:
    value = material.get("id") or material.get("materialId") or payload.get("materialId")
    return str(value) if value else None


def _public_id(material: dict[str, object], payload: dict[str, object]) -> str | None:
    value = material.get("publicId") or material.get("public_id") or payload.get("publicId")
    return str(value) if value else None


def _batches(rows: list[dict[str, object]], batch_size: int) -> list[list[dict[str, object]]]:
    size = max(1, batch_size)
    return [rows[index : index + size] for index in range(0, len(rows), size)]


def _log_extra(message: JobMessage, step: str) -> dict[str, object]:
    return {
        "component": "material_ingest_worker",
        "step": step,
        "jobId": message.job_id,
        "jobType": message.type,
        "materialId": message.resource_id,
        "requestId": message.request_id,
        "correlationId": message.correlation_id,
    }
