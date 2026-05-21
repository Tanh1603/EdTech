from dataclasses import dataclass

from ai_service.clients.be_core import FakeBeCoreClient
from ai_service.providers.llm_provider import FakeLlmProvider
from ai_service.rag.retrieval import Retriever


@dataclass(frozen=True)
class ChatExecutionResult:
    assistant_message_id: str
    content: str
    citations: list[dict[str, object]]


class ChatOrchestrator:
    def __init__(
        self,
        be_core: FakeBeCoreClient,
        llm_provider: FakeLlmProvider,
        retriever: Retriever | None = None,
    ) -> None:
        self.be_core = be_core
        self.llm_provider = llm_provider
        self.retriever = retriever

    def generate(self, session_id: str, prompt: str) -> ChatExecutionResult:
        citations: list[dict[str, object]] = []
        context = ""
        if self.retriever:
            results = self.retriever.search(prompt, top_k=3)
            citations = [result.citation for result in results]
            context = "\n".join(result.content for result in results)
        response = self.llm_provider.generate(f"{context}\n\nUser: {prompt}".strip())
        message = self.be_core.append_assistant_message(session_id, response.text)
        return ChatExecutionResult(
            assistant_message_id=str(message["id"]),
            content=response.text,
            citations=citations,
        )
