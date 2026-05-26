from __future__ import annotations

from collections.abc import Iterator
from typing import Any

from agents.clients.be_core import BeCoreCallContext
from agents.observability.telemetry import span
from agents.orchestrator.builder import build_runtime_graph
from agents.orchestrator.context import chat_state, tool_context
from agents.orchestrator.dependencies import RuntimeDependencies
from agents.orchestrator.state import RuntimeState
from agents.orchestrator.streaming import stream_tutor_response
from agents.profiles.assessment_material import AssessmentMaterialAgentProfile
from agents.profiles.learning_path import LearningPathAgentProfile
from agents.profiles.tutor import TutorAgentProfile


class AgentRuntime:
    def __init__(self, dependencies: RuntimeDependencies) -> None:
        self.dependencies = dependencies
        self.tutor = TutorAgentProfile(
            llm_provider=dependencies.llm_provider,
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
        self.graph = build_runtime_graph(dependencies, self._profile_node)

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
            chat_state("chat", session_id, message_id, context, use_rag, top_k, options)
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
        state = chat_state("stream_chat", session_id, message_id, context, use_rag, top_k, options)
        with span("langgraph.stream_chat", {"session.id": session_id, "job.id": context.job_id}):
            yield from stream_tutor_response(self.dependencies, state)

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
                "tool_context": tool_context(context),
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
                "tool_context": tool_context(context),
            }
        )

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
