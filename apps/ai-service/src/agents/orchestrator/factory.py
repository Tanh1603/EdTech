from agents.clients.be_core import BeCoreGrpcClient
from agents.memory.factory import create_memory_key_builder, create_memory_store
from agents.orchestrator.dependencies import RuntimeDependencies
from agents.orchestrator.graph import AgentRuntime
from agents.providers.factory import create_llm_provider
from agents.rag.factory import create_retriever
from agents.tools.registry import create_default_registry
from config.settings import Settings, get_settings


def create_agent_runtime(settings: Settings | None = None) -> AgentRuntime:
    active_settings = settings or get_settings()
    be_core = BeCoreGrpcClient(active_settings)
    registry = create_default_registry(be_core)
    return AgentRuntime(
        RuntimeDependencies(
            registry=registry,
            llm_provider=create_llm_provider(active_settings),
            retriever=create_retriever(active_settings),
            memory=create_memory_store(active_settings),
            key_builder=create_memory_key_builder(active_settings),
            rag_min_score=active_settings.rag_min_score,
            rag_summary_chunk_limit=active_settings.rag_summary_chunk_limit,
        )
    )
