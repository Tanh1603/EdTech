from __future__ import annotations

import logging
from typing import Any
from uuid import NAMESPACE_URL, uuid5

from qdrant_client import QdrantClient, models
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
    VectorParams,
)

from agents.rag.chunking import TextChunk

from .payloads import chunk_from_payload, chunk_payload

logger = logging.getLogger(__name__)


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
                    payload=chunk_payload(chunk),
                )
                for chunk, vector in records
            ],
        )
        logger.info(
            "Qdrant points upserted",
            extra={
                "component": "qdrant",
                "step": "qdrant.upsert.batch",
                "collection": self.collection_name,
                "materialId": records[0][0].material_id,
                "pointCount": len(records),
                "vectorSize": vector_size,
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
        try:
            response = self.client.query_points(
                collection_name=self.collection_name,
                query=query_vector,
                query_filter=_material_filter(material_id) if material_id else None,
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
        return [
            (chunk_from_payload(dict(point.payload or {})), float(point.score or 0.0))
            for point in response.points
        ]

    def material_chunks(self, material_id: str, limit: int = 24) -> list[TextChunk]:
        if not self.client.collection_exists(self.collection_name):
            logger.info(
                "Qdrant collection missing; returning empty ordered material chunks",
                extra={
                    "component": "qdrant",
                    "step": "scroll.collection_missing",
                    "collection": self.collection_name,
                    "materialId": material_id,
                },
            )
            return []
        response, _next_page = self.client.scroll(
            collection_name=self.collection_name,
            scroll_filter=_material_filter(material_id),
            limit=max(limit, 2000),
            with_payload=True,
            with_vectors=False,
        )
        chunks = [chunk_from_payload(dict(point.payload or {})) for point in response]
        return sorted(chunks, key=lambda chunk: chunk.order_no)[:limit]

    def delete_material(self, material_id: str) -> None:
        if not self.client.collection_exists(self.collection_name):
            return
        self.client.delete(
            collection_name=self.collection_name,
            points_selector=_filter_selector(_material_filter(material_id)),
        )
        logger.info(
            "Qdrant material points deleted",
            extra={
                "component": "qdrant",
                "step": "qdrant.delete_material",
                "collection": self.collection_name,
                "materialId": material_id,
            },
        )

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


def _material_filter(material_id: str) -> Filter:
    return Filter(
        must=[
            FieldCondition(
                key="materialId",
                match=MatchValue(value=material_id),
            )
        ]
    )


def _filter_selector(material_filter: Filter) -> Any:
    filter_selector = getattr(models, "FilterSelector", None)
    if filter_selector:
        return filter_selector(filter=material_filter)
    return material_filter


def _is_missing_collection_error(error: Exception) -> bool:
    message = str(error).lower()
    return "collection" in message and ("doesn't exist" in message or "not found" in message)
