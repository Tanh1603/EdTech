import logging
from dataclasses import dataclass
from typing import Any

from agents.rag import vector_stores
from agents.rag.chunking import SimpleChunker, TextChunk
from agents.rag.embeddings import EmbeddingIndexer
from agents.rag.parsers import DocumentParser, ParsedDocument
from agents.workers.ingestion.context import log_extra
from agents.workers.ingestion.manifest import batches, chunk_manifest_rows
from agents.workers.storage import StorageContent
from agents.workers.worker import JobMessage

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class PreparedMaterialContent:
    document: ParsedDocument
    chunks: list[TextChunk]
    chunk_rows: list[dict[str, object]]


def prepare_material_content(
    material_id: str,
    title: str,
    storage_content: StorageContent,
    parser: DocumentParser,
    chunker: SimpleChunker,
) -> PreparedMaterialContent:
    document = parser.parse_bytes(
        material_id,
        title,
        storage_content.content,
        mime_type=storage_content.mime_type,
        filename=storage_content.filename,
    )
    chunks = chunker.chunk(document)
    if not chunks:
        raise ValueError("No text chunks extracted from material")
    return PreparedMaterialContent(
        document=document,
        chunks=chunks,
        chunk_rows=chunk_manifest_rows(
            material_id,
            chunks,
            mime_type=storage_content.mime_type,
            filename=storage_content.filename,
        ),
    )


def write_chunk_manifest(
    be_core: Any,
    material_id: str,
    chunk_rows: list[dict[str, object]],
    batch_size: int,
    message: JobMessage,
) -> None:
    logger.info(
        "Clearing material chunks in BE Core",
        extra=log_extra(message, "be_core.clear_chunks"),
    )
    be_core.clear_material_chunks(material_id)
    logger.info(
        "Material chunks cleared in BE Core",
        extra=log_extra(message, "be_core.clear_chunks.ok"),
    )
    for batch_index, batch in enumerate(batches(chunk_rows, batch_size), start=1):
        logger.info(
            "Appending material chunks to BE Core",
            extra={
                **log_extra(message, "be_core.append_chunks"),
                "batchIndex": batch_index,
                "batchSize": len(batch),
                "totalChunks": len(chunk_rows),
            },
        )
        be_core.append_material_chunks(material_id, batch)
        logger.info(
            "Material chunk manifest batch written",
            extra={
                **log_extra(message, "chunk_manifest.write.batch"),
                "batchIndex": batch_index,
                "batchSize": len(batch),
                "totalChunks": len(chunk_rows),
            },
        )
    logger.info(
        "Material chunks written to BE Core",
        extra={
            **log_extra(message, "be_core.append_chunks.ok"),
            "chunkCount": len(chunk_rows),
        },
    )


def replace_vector_index(
    vector_store: vector_stores.VectorStore,
    indexer: EmbeddingIndexer,
    material_id: str,
    chunks: list[TextChunk],
) -> None:
    vector_store.delete_material(material_id)
    indexer.index(chunks)
