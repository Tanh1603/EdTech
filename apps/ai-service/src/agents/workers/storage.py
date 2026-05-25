from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx


@dataclass(frozen=True)
class StorageContent:
    content: bytes
    mime_type: str | None = None
    filename: str | None = None
    source: str = "fixture"


class MaterialContentLoader:
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
            with httpx.Client(timeout=30.0, follow_redirects=True) as client:
                response = client.get(storage_url)
                response.raise_for_status()
                return StorageContent(
                    content=response.content,
                    mime_type=response.headers.get("content-type")
                    or str(material.get("mimeType") or payload.get("mimeType") or ""),
                    filename=storage_url.rsplit("/", 1)[-1],
                    source=storage_url,
                )

        raise ValueError("Material content requires inline content, filePath, or storageUrl")
