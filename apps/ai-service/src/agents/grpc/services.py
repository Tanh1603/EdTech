from __future__ import annotations

from collections.abc import Iterator
from dataclasses import dataclass
from typing import Any

from agents.clients.be_core import BeCoreCallContext, BeCoreGrpcClient, from_struct
from agents.grpc.metadata import RequestMetadata, parse_metadata
from agents.rag.factory import create_retriever
from agents.rag.retrieval import Retriever
from agents.runtime.factory import create_agent_runtime
from agents.runtime.graph import AgentRuntime
from config.settings import Settings, get_settings


@dataclass(frozen=True)
class ChatResponse:
    assistant_message_id: str
    content: str
    citations: list[dict[str, Any]]
    usage: dict[str, Any]
    metadata: dict[str, Any]


class AiOrchestratorService:
    def __init__(
        self,
        runtime: AgentRuntime | None = None,
        settings: Settings | None = None,
        be_core: BeCoreGrpcClient | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self._runtime = runtime
        self._be_core = be_core

    @property
    def runtime(self) -> AgentRuntime:
        if self._runtime is None:
            self._runtime = create_agent_runtime(self.settings)
        return self._runtime

    @property
    def be_core(self) -> BeCoreGrpcClient:
        if self._be_core is None:
            self._be_core = BeCoreGrpcClient(self.settings)
        return self._be_core

    def generate_chat_response(
        self,
        session_id: str,
        message_id: str,
        request_context: BeCoreCallContext,
        use_rag: bool = True,
        top_k: int = 5,
        options: dict[str, Any] | None = None,
    ) -> ChatResponse:
        result = self.runtime.generate_chat_response(
            session_id=session_id,
            message_id=message_id,
            context=request_context,
            use_rag=use_rag,
            top_k=top_k or self.settings.rag_top_k_default,
            options=options,
        )
        return ChatResponse(
            assistant_message_id=str(result.get("assistant_message_id") or ""),
            content=str(result.get("content") or ""),
            citations=list(result.get("citations", [])),
            usage=dict(result.get("usage", {})),
            metadata=dict(result.get("metadata", {})),
        )

    def stream_chat_response(
        self,
        session_id: str,
        message_id: str,
        request_context: BeCoreCallContext,
        use_rag: bool = True,
        top_k: int = 5,
        options: dict[str, Any] | None = None,
    ) -> Iterator[dict[str, Any]]:
        yield from self.runtime.stream_chat_response(
            session_id=session_id,
            message_id=message_id,
            context=request_context,
            use_rag=use_rag,
            top_k=top_k or self.settings.rag_top_k_default,
            options=options,
        )

    def accept_job(
        self,
        job_type: str,
        resource_type: str,
        resource_id: str,
        payload: dict[str, Any],
        request_context: BeCoreCallContext,
    ) -> dict[str, str]:
        job = self.be_core.create_job(
            job_type=job_type,
            payload=payload,
            context=request_context,
            priority=int(payload.get("priority") or 0),
            max_attempts=int(payload.get("maxAttempts") or 3),
            created_by=str(payload.get("requestedBy") or request_context.user_id or ""),
            resource_type=resource_type,
            resource_id=resource_id,
        )
        return {
            "jobId": str(job.get("id") or job.get("jobId") or ""),
            "status": str(job.get("status") or "queued"),
            "type": job_type,
            "resourceId": resource_id,
        }


class AiRagService:
    def __init__(
        self,
        retriever: Retriever | None = None,
        settings: Settings | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self._retriever = retriever

    @property
    def retriever(self) -> Retriever:
        if self._retriever is None:
            self._retriever = create_retriever(self.settings)
        return self._retriever

    def search_material_context(
        self,
        query: str,
        top_k: int = 5,
        material_ids: list[str] | None = None,
    ) -> dict[str, object]:
        ids = material_ids or []
        if ids:
            results = []
            for material_id in ids:
                results.extend(
                    self.retriever.search(query=query, top_k=top_k, material_id=material_id)
                )
            results = sorted(results, key=lambda item: item.score, reverse=True)[:top_k]
        else:
            results = self.retriever.search(query=query, top_k=top_k)

        return {
            "chunks": [
                {
                    "materialId": result.citation.get("materialId", ""),
                    "chunkId": result.chunk_id,
                    "title": result.citation.get("title", ""),
                    "content": result.content,
                    "orderNo": result.citation.get("orderNo", 0),
                    "score": result.score,
                    "source": result.citation.get("source", {}),
                    "payload": result.citation,
                }
                for result in results
            ],
            "metadata": {
                "query": query,
                "source": "qdrant",
                "materialIds": ids,
                "topK": top_k,
            },
        }


def context_from_grpc(
    grpc_context: Any,
    user_id: str | None = None,
    job_id: str | None = None,
) -> BeCoreCallContext:
    metadata: RequestMetadata = parse_metadata(grpc_context.invocation_metadata())
    return BeCoreCallContext(
        request_id=metadata.request_id,
        correlation_id=metadata.correlation_id,
        user_id=metadata.user_id or user_id,
        roles=metadata.roles,
        permissions=metadata.permissions,
        job_id=metadata.ai_job_id or job_id,
    )


def options_from_struct(value: Any) -> dict[str, Any]:
    return from_struct(value)
