from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from agents.orchestrator.nodes.common import material_id
from agents.orchestrator.state import RuntimeState
from agents.orchestrator.summary import summary_batches
from agents.rag.retrieval import RetrievalResult, Retriever

logger = logging.getLogger(__name__)


@dataclass
class RetrievalRouterNode:
    retriever: Retriever | None = None
    min_score: float = 0.2
    summary_chunk_limit: int = 24

    def __call__(self, state: RuntimeState) -> RuntimeState:
        if state.get("profile") != "tutor":
            return state
        intent = str(state.get("intent") or "general_tutor")
        active_material_id = material_id(state)
        material_status = str(state.get("learning_context", {}).get("materialStatus") or "")
        if active_material_id and material_status and material_status != "ready":
            logger.info(
                "Tutor retrieval skipped because material is not ready",
                extra={
                    "component": "tutor.orchestrator",
                    "step": "retrieval.material_not_ready",
                    "materialId": active_material_id,
                    "materialStatus": material_status,
                },
            )
            return {
                **state,
                "retrieval_mode": "none",
                "retrieved_context": "",
                "retrieval_results": [],
                "citations": [],
                "rag_scores": [],
            }

        if not self.retriever or not active_material_id or not state.get("use_rag", True):
            return {
                **state,
                "retrieval_mode": "none",
                "retrieved_context": "",
                "retrieval_results": [],
                "citations": [],
                "rag_scores": [],
            }

        if intent == "summary_material":
            chunks = self.retriever.material_chunks(active_material_id, self.summary_chunk_limit)
            results = [
                RetrievalResult(
                    chunk_id=chunk.chunk_id,
                    content=chunk.content,
                    score=1.0,
                    citation=_citation(chunk),
                )
                for chunk in chunks
            ]
            batches = summary_batches(results)
            logger.info(
                "Tutor ordered material retrieval completed",
                extra={
                    "component": "tutor.orchestrator",
                    "step": "retrieval.summary",
                    "materialId": active_material_id,
                    "chunkCount": len(results),
                    "batchCount": len(batches),
                },
            )
            return _retrieval_state(
                state,
                "summary_ordered",
                results,
                summary_batch_items=batches,
            )

        query = str(state.get("standalone_question") or state.get("current_message") or "")
        results = [
            result
            for result in self.retriever.search(
                query,
                top_k=int(state.get("top_k") or 5),
                material_id=active_material_id,
            )
            if result.score >= self.min_score
        ]
        logger.info(
            "Tutor semantic retrieval completed",
            extra={
                "component": "tutor.orchestrator",
                "step": "retrieval.semantic",
                "materialId": active_material_id,
                "resultCount": len(results),
                "topScore": results[0].score if results else 0,
            },
        )
        return _retrieval_state(state, "semantic", results)


def _retrieval_state(
    state: RuntimeState,
    mode: str,
    results: list[RetrievalResult],
    summary_batch_items: list[str] | None = None,
) -> RuntimeState:
    retrieved_context = "\n\n".join(
        f"[{index + 1}] chunkId={result.chunk_id} score={result.score:.4f}\n"
        f"{result.content}"
        for index, result in enumerate(results)
    )
    if summary_batch_items and len(summary_batch_items) > 1:
        retrieved_context = (
            f"{len(results)} ordered chunks loaded for map-reduce summary "
            f"across {len(summary_batch_items)} batches."
        )
    return {
        **state,
        "retrieval_mode": mode,
        "retrieved_context": retrieved_context,
        "retrieval_results": results,
        "citations": [result.citation for result in results],
        "rag_scores": [result.score for result in results],
        "summary_batches": summary_batch_items or [],
    }


def _citation(chunk: Any) -> dict[str, Any]:
    return {
        "materialId": chunk.material_id,
        "chunkId": chunk.chunk_id,
        "title": chunk.title,
        "orderNo": chunk.order_no,
        "source": {"type": "material-text"},
    }
