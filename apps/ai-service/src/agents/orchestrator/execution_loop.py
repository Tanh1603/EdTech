from dataclasses import dataclass

from agents.clients.be_core import BeCoreCallContext, BeCoreGrpcClient
from agents.providers.llm_provider import LlmProvider
from agents.rag.retrieval import Retriever


@dataclass(frozen=True)
class ChatExecutionResult:
    assistant_message_id: str
    content: str
    citations: list[dict[str, object]]


class ChatOrchestrator:
    def __init__(
        self,
        be_core: BeCoreGrpcClient,
        llm_provider: LlmProvider,
        retriever: Retriever | None = None,
    ) -> None:
        self.be_core = be_core
        self.llm_provider = llm_provider
        self.retriever = retriever

    def generate(
        self,
        session_id: str,
        prompt: str,
        context: BeCoreCallContext,
    ) -> ChatExecutionResult:
        citations: list[dict[str, object]] = []
        rag_context_text = ""
        if self.retriever:
            results = self.retriever.search(prompt, top_k=3)
            citations = [result.citation for result in results]
            rag_context_text = "\n".join(result.content for result in results)
        response = self.llm_provider.generate(
            f"{rag_context_text}\n\nUser: {prompt}".strip()
        )
        message = self.be_core.append_assistant_message(
            session_id,
            response.text,
            context,
        )
        return ChatExecutionResult(
            assistant_message_id=str(message["id"]),
            content=response.text,
            citations=citations,
        )
