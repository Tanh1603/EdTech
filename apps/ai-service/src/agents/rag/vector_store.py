import logging
from dataclasses import dataclass, field
from typing import Any, Protocol
from uuid import NAMESPACE_URL, uuid5

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
    VectorParams,
)

from agents.rag.chunking import TextChunk

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class VectorRecord:
    chunk: TextChunk
    vector: list[float]


class VectorStore(Protocol):
    def upsert(self, chunk: TextChunk, vector: list[float]) -> None: ...

    def upsert_many(self, records: list[tuple[TextChunk, list[float]]]) -> None: ...

    def search(
        self,
        query_vector: list[float],
        top_k: int = 5,
        material_id: str | None = None,
    ) -> list[tuple[TextChunk, float]]: ...


def dot(left: list[float], right: list[float]) -> float:
    return sum(a * b for a, b in zip(left, right, strict=False))


def _chunk_payload(chunk: TextChunk) -> dict[str, Any]:
    return {
        "materialId": chunk.material_id,
        "chunkId": chunk.chunk_id,
        "title": chunk.title,
        "content": chunk.content,
        "orderNo": chunk.order_no,
        "source": "material-text",
    }


def _chunk_from_payload(payload: dict[str, Any]) -> TextChunk:
    return TextChunk(
        material_id=str(payload.get("materialId") or ""),
        chunk_id=str(payload.get("chunkId") or ""),
        title=str(payload.get("title") or ""),
        content=str(payload.get("content") or ""),
        order_no=int(payload.get("orderNo") or 0),
    )


@dataclass
class InMemoryVectorStore:
    records: list[VectorRecord] = field(default_factory=list)

    def upsert(self, chunk: TextChunk, vector: list[float]) -> None:
        self.records = [
            record for record in self.records if record.chunk.chunk_id != chunk.chunk_id
        ]
        self.records.append(VectorRecord(chunk=chunk, vector=vector))

    def upsert_many(self, records: list[tuple[TextChunk, list[float]]]) -> None:
        for chunk, vector in records:
            self.upsert(chunk, vector)

    def search(
        self,
        query_vector: list[float],
        top_k: int = 5,
        material_id: str | None = None,
    ) -> list[tuple[TextChunk, float]]:
        ranked = sorted(
            (
                (record.chunk, dot(query_vector, record.vector))
                for record in self.records
                if material_id is None or record.chunk.material_id == material_id
            ),
            key=lambda item: item[1],
            reverse=True,
        )
        return ranked[:top_k]


class QdrantVectorStore:
    def __init__(
        self,
        url: str,
        collection_name: str,
        grpc_port: int = 6334,
        prefer_grpc: bool = True,
        api_key: str | None = None,
    ) -> None:
        self.client = QdrantClient(
            url=url,
            grpc_port=grpc_port,
            prefer_grpc=prefer_grpc,
            api_key=api_key,
        )
        self.collection_name = collection_name

    def upsert(self, chunk: TextChunk, vector: list[float]) -> None:
        self.upsert_many([(chunk, vector)])

    def upsert_many(self, records: list[tuple[TextChunk, list[float]]]) -> None:
        if not records:
            return
        vector_size = len(records[0][1])
        self._ensure_collection(vector_size)
        self.client.upsert(
            collection_name=self.collection_name,
            points=[
                PointStruct(
                    id=str(uuid5(NAMESPACE_URL, chunk.chunk_id)),
                    vector=vector,
                    payload=_chunk_payload(chunk),
                )
                for chunk, vector in records
            ],
        )
        logger.info(
            "Qdrant points upserted",
            extra={
                "component": "qdrant",
                "step": "points.upsert.batch",
                "collection": self.collection_name,
                "materialId": records[0][0].material_id,
                "pointCount": len(records),
                "vectorSize": vector_size,
            },
        )

    def _upsert_one_legacy(self, chunk: TextChunk, vector: list[float]) -> None:
        self._ensure_collection(len(vector))
        self.client.upsert(
            collection_name=self.collection_name,
            points=[
                PointStruct(
                    id=str(uuid5(NAMESPACE_URL, chunk.chunk_id)),
                    vector=vector,
                    payload=_chunk_payload(chunk),
                )
            ],
        )
        logger.debug(
            "Qdrant point upserted",
            extra={
                "component": "qdrant",
                "step": "point.upsert",
                "collection": self.collection_name,
                "materialId": chunk.material_id,
                "vectorSize": len(vector),
            },
        )

    def search(
        self,
        query_vector: list[float],
        top_k: int = 5,
        material_id: str | None = None,
    ) -> list[tuple[TextChunk, float]]:
        if not self.client.collection_exists(self.collection_name):
            logger.info(
                "Qdrant collection missing; returning empty search results",
                extra={
                    "component": "qdrant",
                    "step": "search.collection_missing",
                    "collection": self.collection_name,
                },
            )
            return []
        query_filter = None
        if material_id:
            query_filter = Filter(
                must=[
                    FieldCondition(
                        key="materialId",
                        match=MatchValue(value=material_id),
                    )
                ]
            )

        try:
            response = self.client.query_points(
                collection_name=self.collection_name,
                query=query_vector,
                query_filter=query_filter,
                limit=top_k,
                with_payload=True,
            )
        except Exception as error:
            if _is_missing_collection_error(error):
                logger.info(
                    "Qdrant collection missing during search; returning empty results",
                    extra={
                        "component": "qdrant",
                        "step": "search.collection_missing",
                        "collection": self.collection_name,
                    },
                )
                return []
            raise

        results: list[tuple[TextChunk, float]] = []
        for point in response.points:
            payload = dict(point.payload or {})
            results.append((_chunk_from_payload(payload), float(point.score or 0.0)))
        return results

    def _ensure_collection(self, vector_size: int) -> None:
        if self.client.collection_exists(self.collection_name):
            return
        self.client.create_collection(
            collection_name=self.collection_name,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
        )
        logger.info(
            "Qdrant collection created",
            extra={
                "component": "qdrant",
                "step": "collection.created",
                "collection": self.collection_name,
                "vectorSize": vector_size,
            },
        )


def _is_missing_collection_error(error: Exception) -> bool:
    message = str(error).lower()
    return "collection" in message and (
        "doesn't exist" in message or "not found" in message
    )
