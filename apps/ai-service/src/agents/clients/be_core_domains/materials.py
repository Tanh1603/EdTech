from __future__ import annotations

from typing import Any

from agents.clients.be_core_common import BeCoreCallContext, to_struct


class MaterialsClientMixin:
    def get_materials(
        self,
        lesson_id: str,
        context: BeCoreCallContext,
        status: str | None = None,
        page: int = 1,
        limit: int = 50,
    ) -> dict[str, Any]:
        request = self._materials_pb2.MaterialQuery(
            lesson_id=lesson_id,
            status=status or "",
            page=page,
            limit=limit,
        )
        return self._call_page(self.materials.GetMaterials, request, context, True)

    def get_material(self, material_id: str, context: BeCoreCallContext) -> dict[str, Any]:
        request = self._materials_pb2.MaterialIdRequest(material_id=material_id)
        return self._call_object(self.materials.GetMaterialDetail, request, context, True)

    def get_material_chunks(
        self,
        material_id: str,
        context: BeCoreCallContext,
        page: int = 1,
        limit: int = 50,
    ) -> dict[str, Any]:
        request = self._materials_pb2.MaterialChunksQuery(
            material_id=material_id,
            page=page,
            limit=limit,
        )
        return self._call_page(self.materials.GetMaterialChunks, request, context, True)

    def get_chunk_detail(
        self,
        material_id: str,
        chunk_id: str,
        context: BeCoreCallContext,
    ) -> dict[str, Any]:
        request = self._materials_pb2.MaterialChunkIdRequest(
            material_id=material_id,
            chunk_id=chunk_id,
        )
        return self._call_object(self.materials.GetChunkDetail, request, context, True)

    def replace_material_chunks(
        self,
        material_id: str,
        chunks: list[dict[str, Any]],
    ) -> dict[str, Any]:
        request = self._materials_pb2.ReplaceMaterialChunksRequest(
            material_id=material_id,
            chunks=self._chunk_writes(chunks),
        )
        return self._call_object(self.materials.ReplaceMaterialChunks, request, None, False)

    def clear_material_chunks(self, material_id: str) -> dict[str, Any]:
        request = self._materials_pb2.MaterialIdRequest(material_id=material_id)
        return self._call_object(self.materials.ClearMaterialChunks, request, None, False)

    def append_material_chunks(
        self,
        material_id: str,
        chunks: list[dict[str, Any]],
    ) -> dict[str, Any]:
        request = self._materials_pb2.AppendMaterialChunksRequest(
            material_id=material_id,
            chunks=self._chunk_writes(chunks),
        )
        return self._call_object(self.materials.AppendMaterialChunks, request, None, False)

    def update_material_status(
        self,
        material_id: str,
        status: str,
        error: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        request = self._materials_pb2.UpdateMaterialStatusRequest(
            material_id=material_id,
            status=status,
            error=to_struct(error),
        )
        return self._call_object(self.materials.UpdateMaterialStatus, request, None, False)

    def update_material_summary(
        self,
        material_id: str,
        summary: str,
        context: BeCoreCallContext,
    ) -> dict[str, Any]:
        request = self._materials_pb2.UpdateMaterialSummaryRequest(
            material_id=material_id,
            summary=summary,
        )
        return self._call_object(self.materials.UpdateMaterialSummary, request, context, True)

    def _chunk_writes(self, chunks: list[dict[str, Any]]) -> list[Any]:
        writes = []
        for chunk in chunks:
            write = self._materials_pb2.MaterialChunkWrite(
                chunk_id=str(chunk.get("chunkId") or ""),
                content=str(chunk.get("content") or ""),
                order_no=int(chunk.get("orderNo") or 0),
                token_count=int(chunk.get("tokenCount") or 0),
                embedding_id=str(chunk.get("embeddingId") or ""),
                checksum=str(chunk.get("checksum") or ""),
            )
            if hasattr(write, "preview"):
                write.preview = str(chunk.get("preview") or "")
            if hasattr(write, "storage_key"):
                write.storage_key = str(chunk.get("storageKey") or "")
            if hasattr(write, "page_no"):
                write.page_no = int(chunk.get("pageNo") or 0)
            if hasattr(write, "source"):
                write.source.CopyFrom(to_struct(chunk.get("source")))
            writes.append(write)
        return writes
