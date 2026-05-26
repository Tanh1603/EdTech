import logging
from time import perf_counter

from agents.clients.be_core import BeCoreGrpcClient
from agents.providers.embedding_provider import EmbeddingProvider
from agents.providers.factory import create_embedding_provider
from agents.rag import vector_stores
from agents.rag.chunking import SimpleChunker
from agents.rag.embeddings import EmbeddingIndexer
from agents.rag.factory import create_vector_store
from agents.rag.parsers import DocumentParser
from agents.workers.ingestion import (
    context_from_message,
    log_extra,
    prepare_material_content,
    replace_vector_index,
    write_chunk_manifest,
)
from agents.workers.storage import MaterialContentLoader
from agents.workers.worker import JobMessage
from config.settings import Settings, get_settings

logger = logging.getLogger(__name__)


class MaterialIngestWorker:
    def __init__(
        self,
        be_core: BeCoreGrpcClient | None = None,
        vector_store: vector_stores.VectorStore | None = None,
        embedding_provider: EmbeddingProvider | None = None,
        content_loader: MaterialContentLoader | None = None,
        settings: Settings | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.be_core = be_core
        self.parser = DocumentParser()
        self.content_loader = content_loader or MaterialContentLoader(self._resolve_file_access)
        self.chunker = SimpleChunker(max_words=360)
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
            context = context_from_message(message)
            logger.info(
                "Material ingest started",
                extra=log_extra(message, "ingest.started"),
            )
            if self.be_core:
                logger.info(
                    "Updating material status to indexing",
                    extra=log_extra(message, "material.status.indexing"),
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
                    **log_extra(message, "material.fetch"),
                    "status": "be_core" if self.be_core and context.user_id else "payload",
                },
            )
            title = str(material.get("title") or message.payload.get("title") or material_id)
            storage_content = self.content_loader.load(material, message.payload)
            logger.info(
                "Material content downloaded",
                extra={
                    **log_extra(message, "download.ok"),
                    "byteSize": len(storage_content.content),
                    "status": storage_content.mime_type or "",
                },
            )
            prepared = prepare_material_content(
                material_id,
                title,
                storage_content,
                self.parser,
                self.chunker,
            )
            logger.info(
                "Material content parsed",
                extra={
                    **log_extra(message, "parse.ok"),
                    "textLength": len(prepared.document.text),
                },
            )
            logger.info(
                "Material content chunked",
                extra={**log_extra(message, "chunk.ok"), "chunkCount": len(prepared.chunks)},
            )
            if self.be_core:
                write_chunk_manifest(
                    self.be_core,
                    material_id,
                    prepared.chunk_rows,
                    self.settings.material_chunk_write_batch_size,
                    message,
                )
            replace_vector_index(self.vector_store, self.indexer, material_id, prepared.chunks)
            logger.info(
                "Material chunks embedded and upserted",
                extra={
                    **log_extra(message, "qdrant.upsert.ok"),
                    "chunkCount": len(prepared.chunks),
                },
            )
            if self.be_core:
                self.be_core.update_material_status(material_id, "ready")
            duration_ms = round((perf_counter() - started) * 1000)
            logger.info(
                "Material ingest succeeded",
                extra={
                    **log_extra(message, "ingest.succeeded"),
                    "chunkCount": len(prepared.chunks),
                    "durationMs": duration_ms,
                },
            )
            return {"materialId": material_id, "chunkCount": len(prepared.chunks)}
        except Exception as error:
            logger.exception(
                "Material ingest failed",
                extra={
                    **log_extra(message, "ingest.failed"),
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
                        extra=log_extra(message, "material.status.failed_error"),
                    )
            raise


def _material_id(material: dict[str, object], payload: dict[str, object]) -> str | None:
    value = material.get("id") or material.get("materialId") or payload.get("materialId")
    return str(value) if value else None


def _public_id(material: dict[str, object], payload: dict[str, object]) -> str | None:
    value = material.get("publicId") or material.get("public_id") or payload.get("publicId")
    return str(value) if value else None
