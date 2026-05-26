from collections.abc import Callable
from typing import Any

from langgraph.graph import END, START, StateGraph

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
from agents.orchestrator.tool_executor import ToolExecutorNode
from agents.orchestrator.tool_selector import select_tools_node


def build_runtime_graph(
    dependencies: RuntimeDependencies,
    profile_node: Callable[[RuntimeState], RuntimeState],
) -> Any:
    graph = StateGraph(RuntimeState)
    graph.add_node("planner", plan_node)
    graph.add_node("reasoner", reason_node)
    graph.add_node("tool_selector", select_tools_node)
    graph.add_node("tool_executor", ToolExecutorNode(dependencies.registry))
    graph.add_node("load_context", load_context_node)
    graph.add_node("memory", MemoryNode(dependencies.memory, dependencies.key_builder))
    graph.add_node("intent_router", intent_router_node)
    graph.add_node("query_rewriter", query_rewriter_node)
    graph.add_node("business_policy", BusinessPolicyNode())
    graph.add_node("retrieval_router", RetrievalRouterNode(dependencies.retriever))
    graph.add_node("prompt_builder", prompt_builder_node)
    graph.add_node("profile", profile_node)
    graph.add_node("response_guard", response_guard_node)
    graph.add_node("persistence", PersistenceNode(dependencies.registry))
    graph.add_edge(START, "planner")
    graph.add_edge("planner", "reasoner")
    graph.add_edge("reasoner", "tool_selector")
    graph.add_edge("tool_selector", "tool_executor")
    graph.add_edge("tool_executor", "load_context")
    graph.add_edge("load_context", "memory")
    graph.add_edge("memory", "intent_router")
    graph.add_edge("intent_router", "query_rewriter")
    graph.add_edge("query_rewriter", "business_policy")
    graph.add_edge("business_policy", "retrieval_router")
    graph.add_edge("retrieval_router", "prompt_builder")
    graph.add_edge("prompt_builder", "profile")
    graph.add_edge("profile", "response_guard")
    graph.add_edge("response_guard", "persistence")
    graph.add_edge("persistence", END)
    return graph.compile()
