from __future__ import annotations

from typing import Any

from agents.clients.be_core_common import BeCoreCallContext


class StorageClientMixin:
    def delete_storage_file(
        self,
        public_id: str,
        context: BeCoreCallContext,
    ) -> dict[str, Any]:
        request = self._storage_pb2.DeleteFileRequest(public_id=public_id)
        return self._call_delete(self.storage.DeleteFile, request, context, True)

    def resolve_file_access(
        self,
        material_id: str | None = None,
        public_id: str | None = None,
    ) -> dict[str, str]:
        request = self._storage_pb2.ResolveFileAccessRequest(
            material_id=material_id or "",
            public_id=public_id or "",
        )
        response = self._call(
            self.storage.ResolveFileAccess,
            request,
            None,
            require_user=False,
        )
        return {
            "downloadUrl": getattr(response, "download_url", ""),
            "mimeType": getattr(response, "mime_type", ""),
            "filename": getattr(response, "filename", ""),
            "expiresAt": getattr(response, "expires_at", ""),
        }
