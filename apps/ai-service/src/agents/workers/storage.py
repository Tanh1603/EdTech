from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Protocol

import httpx

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class StorageContent:
    content: bytes
    mime_type: str | None = None
    filename: str | None = None
    source: str = "fixture"


class FileAccessResolver(Protocol):
    def __call__(self, material: dict[str, Any], payload: dict[str, Any]) -> dict[str, str]: ...


class MaterialContentLoader:
    def __init__(self, resolve_file_access: FileAccessResolver | None = None) -> None:
        self.resolve_file_access = resolve_file_access

    def load(self, material: dict[str, Any], payload: dict[str, Any]) -> StorageContent:
        inline_content = payload.get("content") or material.get("content")
        if isinstance(inline_content, str) and inline_content:
            return StorageContent(
                content=inline_content.encode("utf-8"),
                mime_type=str(material.get("mimeType") or payload.get("mimeType") or "text/plain"),
                filename=str(material.get("title") or payload.get("title") or "fixture.txt"),
                source="inline",
            )

        file_path = payload.get("filePath") or material.get("filePath")
        if isinstance(file_path, str) and file_path:
            path = Path(file_path)
            return StorageContent(
                content=path.read_bytes(),
                mime_type=str(material.get("mimeType") or payload.get("mimeType") or ""),
                filename=path.name,
                source=str(path),
            )

        storage_url = (
            material.get("storageUrl")
            or material.get("storage_url")
            or payload.get("storageUrl")
            or payload.get("storage_url")
        )
        if isinstance(storage_url, str) and storage_url:
            return self._download_with_resolved_fallback(storage_url, material, payload)

        raise ValueError("Material content requires inline content, filePath, or storageUrl")

    def _download_with_resolved_fallback(
        self,
        storage_url: str,
        material: dict[str, Any],
        payload: dict[str, Any],
    ) -> StorageContent:
        try:
            return self._download(
                storage_url,
                mime_type=str(material.get("mimeType") or payload.get("mimeType") or ""),
            )
        except httpx.HTTPStatusError as error:
            if error.response.status_code not in (401, 403) or not self.resolve_file_access:
                raise
            logger.info(
                "Material storage URL requires resolved access",
                extra={
                    "component": "material_content_loader",
                    "step": "download.unauthorized",
                    "materialId": str(material.get("id") or payload.get("materialId") or ""),
                    "status": str(error.response.status_code),
                },
            )

        access = self.resolve_file_access(material, payload)
        download_url = access.get("downloadUrl") or access.get("download_url") or ""
        if not download_url:
            raise ValueError("Material file is not accessible: BE Core returned no download URL")

        logger.info(
            "Resolved material file access",
            extra={
                "component": "material_content_loader",
                "step": "storage.resolve_access",
                "materialId": str(material.get("id") or payload.get("materialId") or ""),
            },
        )
        return self._download(
            download_url,
            mime_type=access.get("mimeType")
            or access.get("mime_type")
            or str(material.get("mimeType") or payload.get("mimeType") or ""),
            filename=access.get("filename") or "",
        )

    def _download(
        self,
        url: str,
        mime_type: str = "",
        filename: str = "",
    ) -> StorageContent:
        with httpx.Client(timeout=30.0, follow_redirects=True) as client:
            response = client.get(url)
            response.raise_for_status()
            logger.info(
                "Material content downloaded",
                extra={
                    "component": "material_content_loader",
                    "step": "download.ok",
                    "byteSize": len(response.content),
                    "status": response.headers.get("content-type") or mime_type,
                },
            )
            return StorageContent(
                content=response.content,
                mime_type=response.headers.get("content-type") or mime_type,
                filename=filename or url.rsplit("/", 1)[-1].split("?", 1)[0],
                source=url,
            )
