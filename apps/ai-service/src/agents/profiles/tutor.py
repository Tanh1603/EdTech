from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate

from agents.memory.session_memory import MemoryKeyBuilder, MemoryStore
from agents.profiles.common import message_content, page_items_text
from agents.providers.llm_provider import LlmProvider
from agents.rag.retrieval import Retriever
from agents.runtime.state import RuntimeState


class TutorAgentProfile:
    def __init__(
        self,
        llm_provider: LlmProvider,
        retriever: Retriever | None = None,
        memory: MemoryStore | None = None,
        key_builder: MemoryKeyBuilder | None = None,
    ) -> None:
        self.llm_provider = llm_provider
        self.retriever = retriever
        self.memory = memory
        self.key_builder = key_builder or MemoryKeyBuilder()
        self.prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are TutorAgent for an EdTech platform. Answer with concise, "
                    "grounded guidance. Use retrieved material when available and do "
                    "not invent citations.",
                ),
                (
                    "human",
                    "Conversation:\n{history}\n\nRetrieved context:\n{rag_context}\n\n"
                    "Student question:\n{question}",
                ),
            ]
        )

    def run(self, state: RuntimeState) -> RuntimeState:
        prompt_text, citations, retrieval_results = self.prepare_prompt(state)
        response = self.llm_provider.generate(prompt_text)
        self._remember_usage(state, response.input_tokens + response.output_tokens)
        return {
            **state,
            "prompt": self._question(state),
            "retrieval_results": retrieval_results,
            "citations": citations,
            "content": response.text,
            "usage": {
                "inputTokens": response.input_tokens,
                "outputTokens": response.output_tokens,
                "totalTokens": response.input_tokens + response.output_tokens,
                "model": response.model,
            },
        }

    def prepare_prompt(
        self,
        state: RuntimeState,
    ) -> tuple[str, list[dict[str, object]], list[object]]:
        question = self._question(state)
        history = page_items_text(state.get("tool_results", {}).get("chat.messages"))
        retrieval_results: list[object] = []
        citations: list[dict[str, object]] = []
        rag_context = ""

        if self.retriever and state.get("use_rag", True) and question:
            retrieval_results = self.retriever.search(
                question,
                top_k=int(state.get("top_k") or 5),
                material_id=_optional_material_id(state),
            )
            citations = [result.citation for result in retrieval_results]
            rag_context = "\n".join(result.content for result in retrieval_results)

        prompt_value = self.prompt.invoke(
            {
                "history": history or "No previous messages loaded.",
                "rag_context": rag_context or "No retrieved context.",
                "question": question,
            }
        )
        return prompt_value.to_string(), citations, retrieval_results

    def build_stream_prompt(self, state: RuntimeState) -> tuple[str, list[dict[str, object]]]:
        prompt_text, citations, _retrieval_results = self.prepare_prompt(state)
        return prompt_text, citations

    def _question(self, state: RuntimeState) -> str:
        if state.get("prompt"):
            return str(state["prompt"])
        tool_results = state.get("tool_results", {})
        return message_content(tool_results.get("chat.message"))

    def _remember_usage(self, state: RuntimeState, tokens: int) -> None:
        if not self.memory or not state.get("session_id"):
            return
        key = self.key_builder.session_token_budget(str(state["session_id"]))
        self.memory.increment(key, tokens, ttl_seconds=3600)


def _optional_material_id(state: RuntimeState) -> str | None:
    options = state.get("options", {})
    material_id = options.get("materialId") if isinstance(options, dict) else None
    return str(material_id) if material_id else None
