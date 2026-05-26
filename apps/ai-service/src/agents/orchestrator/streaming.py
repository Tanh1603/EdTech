import logging
from collections.abc import Iterator
from typing import Any

from agents.orchestrator.context import clean_stream_token
from agents.orchestrator.dependencies import RuntimeDependencies
from agents.orchestrator.nodes import (
    BusinessPolicyNode,
    MemoryNode,
    RetrievalRouterNode,
    intent_router_node,
    load_context_node,
    prompt_builder_node,
    query_rewriter_node,
    response_guard_node,
)
from agents.orchestrator.persistence import PersistenceNode
from agents.orchestrator.planner import plan_node
from agents.orchestrator.reasoner import reason_node
from agents.orchestrator.state import RuntimeState
from agents.orchestrator.summary import generate_map_reduce_summary
from agents.orchestrator.tool_executor import ToolExecutorNode
from agents.orchestrator.tool_selector import select_tools_node

logger = logging.getLogger(__name__)


def stream_tutor_response(
    dependencies: RuntimeDependencies,
    state: RuntimeState,
) -> Iterator[dict[str, Any]]:
    for node in (
        plan_node,
        reason_node,
        select_tools_node,
        ToolExecutorNode(dependencies.registry),
        load_context_node,
        MemoryNode(dependencies.memory, dependencies.key_builder),
        intent_router_node,
        query_rewriter_node,
        BusinessPolicyNode(),
        RetrievalRouterNode(
            dependencies.retriever,
            min_score=dependencies.rag_min_score,
            summary_chunk_limit=dependencies.rag_summary_chunk_limit,
        ),
        prompt_builder_node,
    ):
        state = node(state)

    prompt = str(state.get("prompt_text") or "")
    citations = state.get("citations", [])
    session_id = str(state.get("session_id") or "")
    message_id = str(state.get("message_id") or "")
    chunks: list[str] = []
    if state.get("intent") == "summary_material" and len(state.get("summary_batches", [])) > 1:
        content, usage = generate_map_reduce_summary(dependencies.llm_provider, state)
        guarded_state = response_guard_node(
            {**state, "content": content, "citations": citations, "usage": usage}
        )
        final_state = PersistenceNode(dependencies.registry)(guarded_state)
        for chunk in _chunk_text(str(final_state.get("content") or "")):
            yield {"text": chunk, "citations": [], "isFinal": False}
        yield {
            "text": "",
            "citations": final_state.get("citations", citations),
            "isFinal": True,
            "assistantMessageId": final_state.get("assistant_message_id", ""),
        }
        return
    logger.info(
        "Tutor model stream started",
        extra={
            "component": "tutor.orchestrator",
            "step": "model.stream",
            "sessionId": session_id,
            "messageId": message_id,
            "intent": state.get("intent", ""),
            "retrievalMode": state.get("retrieval_mode", ""),
        },
    )
    for token in dependencies.llm_provider.stream(prompt):
        clean_token = clean_stream_token(token)
        if not clean_token:
            continue
        chunks.append(clean_token)
        yield {"text": clean_token, "citations": [], "isFinal": False}

    content = "".join(chunks)
    guarded_state = response_guard_node({**state, "content": content, "citations": citations})
    final_state = PersistenceNode(dependencies.registry)(guarded_state)
    yield {
        "text": "",
        "citations": final_state.get("citations", citations),
        "isFinal": True,
        "assistantMessageId": final_state.get("assistant_message_id", ""),
    }


def _chunk_text(value: str, size: int = 500) -> Iterator[str]:
    for index in range(0, len(value), size):
        yield value[index : index + size]
