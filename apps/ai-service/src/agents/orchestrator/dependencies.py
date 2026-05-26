from dataclasses import dataclass

from agents.memory.session_memory import MemoryKeyBuilder, MemoryStore
from agents.providers.llm_provider import LlmProvider
from agents.rag.retrieval import Retriever
from agents.tools.registry import ToolRegistry


@dataclass(frozen=True)
class RuntimeDependencies:
    registry: ToolRegistry
    llm_provider: LlmProvider
    retriever: Retriever | None = None
    memory: MemoryStore | None = None
    key_builder: MemoryKeyBuilder | None = None
    rag_min_score: float = 0.2
    rag_summary_chunk_limit: int = 24
