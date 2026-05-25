from agents.observability.telemetry import span
from agents.runtime.state import RuntimeState
from agents.tools.registry import ToolRegistry


class ToolExecutorNode:
    def __init__(self, registry: ToolRegistry) -> None:
        self.registry = registry

    def __call__(self, state: RuntimeState) -> RuntimeState:
        context = state.get("tool_context")
        results: dict[str, object] = dict(state.get("tool_results", {}))
        if context is None:
            return {**state, "tool_results": results}

        for call in state.get("tool_calls", []):
            name = call["name"]
            with span(
                "langgraph.tool_call",
                {
                    "tool.name": name,
                    "agent.action": state.get("action"),
                    "job.id": state.get("job_id"),
                },
            ):
                results[name] = self.registry.call(name, call.get("payload", {}), context)

        return {**state, "tool_results": results}
