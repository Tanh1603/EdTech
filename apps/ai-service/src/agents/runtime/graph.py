from __future__ import annotations

import re
from collections.abc import Iterator
from dataclasses import dataclass
from typing import Any

from langgraph.graph import END, START, StateGraph

from agents.clients.be_core import BeCoreCallContext
from agents.memory.session_memory import MemoryKeyBuilder, MemoryStore
from agents.observability.telemetry import span
from agents.profiles.assessment_material import AssessmentMaterialAgentProfile
from agents.profiles.learning_path import LearningPathAgentProfile
from agents.profiles.tutor import TutorAgentProfile
from agents.providers.llm_provider import LlmProvider
from agents.rag.retrieval import Retriever
from agents.runtime.persistence import PersistenceNode
from agents.runtime.planner import plan_node
from agents.runtime.reasoner import reason_node
from agents.runtime.state import RuntimeState
from agents.runtime.tool_executor import ToolExecutorNode
from agents.runtime.tool_selector import select_tools_node
from agents.tools.registry import ToolContext, ToolRegistry


@dataclass(frozen=True)
class RuntimeDependencies:
    registry: ToolRegistry
    llm_provider: LlmProvider
    retriever: Retriever | None = None
    memory: MemoryStore | None = None
    key_builder: MemoryKeyBuilder | None = None


class AgentRuntime:
    def __init__(self, dependencies: RuntimeDependencies) -> None:
        self.dependencies = dependencies
        self.tutor = TutorAgentProfile(
            llm_provider=dependencies.llm_provider,
            retriever=dependencies.retriever,
            memory=dependencies.memory,
            key_builder=dependencies.key_builder,
        )
        self.learning_path = LearningPathAgentProfile(
            dependencies.llm_provider,
            dependencies.registry,
        )
        self.assessment_material = AssessmentMaterialAgentProfile(
            dependencies.llm_provider,
            dependencies.registry,
        )
        self.graph = self._compile_graph()

    def invoke(self, state: RuntimeState) -> RuntimeState:
        with span(
            "langgraph.invoke",
            {
                "agent.profile": state.get("profile"),
                "agent.action": state.get("action"),
                "job.id": state.get("job_id"),
            },
        ):
            return self.graph.invoke(state)

    def generate_chat_response(
        self,
        session_id: str,
        message_id: str,
        context: BeCoreCallContext,
        use_rag: bool = True,
        top_k: int = 5,
        options: dict[str, Any] | None = None,
    ) -> RuntimeState:
        return self.invoke(
            {
                "action": "chat",
                "profile": "tutor",
                "session_id": session_id,
                "message_id": message_id,
                "user_id": context.user_id or "",
                "job_id": context.job_id or "",
                "use_rag": use_rag,
                "top_k": top_k,
                "options": options or {},
                "request_context": context,
                "tool_context": _tool_context(context),
            }
        )

    def stream_chat_response(
        self,
        session_id: str,
        message_id: str,
        context: BeCoreCallContext,
        use_rag: bool = True,
        top_k: int = 5,
        options: dict[str, Any] | None = None,
    ) -> Iterator[dict[str, Any]]:
        state: RuntimeState = {
            "action": "stream_chat",
            "profile": "tutor",
            "session_id": session_id,
            "message_id": message_id,
            "user_id": context.user_id or "",
            "job_id": context.job_id or "",
            "use_rag": use_rag,
            "top_k": top_k,
            "options": options or {},
            "request_context": context,
            "tool_context": _tool_context(context),
        }
        with span("langgraph.stream_chat", {"session.id": session_id, "job.id": context.job_id}):
            for node in (
                plan_node,
                reason_node,
                select_tools_node,
                ToolExecutorNode(self.dependencies.registry),
            ):
                state = node(state)
            prompt, citations = self.tutor.build_stream_prompt(state)
            chunks: list[str] = []
            for token in self.dependencies.llm_provider.stream(prompt):
                clean_token = _clean_stream_token(token)
                if not clean_token:
                    continue
                chunks.append(clean_token)
                yield {"text": clean_token, "citations": [], "isFinal": False}

            content = "".join(chunks)
            final_state = PersistenceNode(self.dependencies.registry)(
                {**state, "content": content, "citations": citations}
            )
        yield {
            "text": "",
            "citations": citations,
            "isFinal": True,
            "assistantMessageId": final_state.get("assistant_message_id", ""),
        }

    def grade_submission(
        self,
        submission_id: str,
        context: BeCoreCallContext,
        options: dict[str, Any] | None = None,
    ) -> RuntimeState:
        return self.invoke(
            {
                "action": "grade_submission",
                "profile": "assessment_material",
                "resource_id": submission_id,
                "job_id": context.job_id or "",
                "options": options or {},
                "request_context": context,
                "tool_context": _tool_context(context),
            }
        )

    def generate_roadmap(
        self,
        user_id: str,
        class_id: str,
        course_id: str,
        context: BeCoreCallContext,
        options: dict[str, Any] | None = None,
    ) -> RuntimeState:
        return self.invoke(
            {
                "action": "generate_roadmap",
                "profile": "learning_path",
                "user_id": user_id,
                "class_id": class_id,
                "course_id": course_id,
                "job_id": context.job_id or "",
                "options": options or {},
                "request_context": context,
                "tool_context": _tool_context(context),
            }
        )

    def _compile_graph(self) -> Any:
        graph = StateGraph(RuntimeState)
        graph.add_node("planner", plan_node)
        graph.add_node("reasoner", reason_node)
        graph.add_node("tool_selector", select_tools_node)
        graph.add_node("tool_executor", ToolExecutorNode(self.dependencies.registry))
        graph.add_node("profile", self._profile_node)
        graph.add_node("persistence", PersistenceNode(self.dependencies.registry))
        graph.add_edge(START, "planner")
        graph.add_edge("planner", "reasoner")
        graph.add_edge("reasoner", "tool_selector")
        graph.add_edge("tool_selector", "tool_executor")
        graph.add_edge("tool_executor", "profile")
        graph.add_edge("profile", "persistence")
        graph.add_edge("persistence", END)
        return graph.compile()

    def _profile_node(self, state: RuntimeState) -> RuntimeState:
        profile = state.get("profile", "tutor")
        with span(
            "langgraph.profile",
            {"agent.profile": profile, "agent.action": state.get("action")},
        ):
            if profile == "learning_path":
                return self.learning_path.run(state)
            if profile == "assessment_material":
                return self.assessment_material.run(state)
            return self.tutor.run(state)


def _tool_context(context: BeCoreCallContext) -> ToolContext:
    return ToolContext(
        request_id=context.request_id,
        correlation_id=context.correlation_id,
        user_id=context.user_id,
        roles=context.roles,
        permissions=context.permissions,
        job_id=context.job_id,
    )


def _clean_stream_token(token: str) -> str:
    return re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", token)
