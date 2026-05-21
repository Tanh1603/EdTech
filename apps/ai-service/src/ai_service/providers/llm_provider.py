from collections.abc import Iterable
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class LlmResponse:
    text: str
    model: str
    input_tokens: int
    output_tokens: int


class LlmProvider(Protocol):
    def generate(self, prompt: str) -> LlmResponse:
        raise NotImplementedError

    def stream(self, prompt: str) -> Iterable[str]:
        raise NotImplementedError


class FakeLlmProvider:
    model = "fake-llm"

    def generate(self, prompt: str) -> LlmResponse:
        text = f"Fake response: {prompt[:120]}"
        return LlmResponse(
            text=text,
            model=self.model,
            input_tokens=len(prompt.split()),
            output_tokens=len(text.split()),
        )

    def stream(self, prompt: str) -> Iterable[str]:
        yield from self.generate(prompt).text.split()
