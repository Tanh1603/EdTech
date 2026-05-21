from collections.abc import Iterable
from dataclasses import dataclass
from typing import Protocol

from groq import Groq

from agents.grpc.errors import AiErrorCode, AiServiceError


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


class GroqLlmProvider:
    def __init__(
        self,
        api_key: str,
        model: str,
        temperature: float,
        max_tokens: int,
    ) -> None:
        if not api_key:
            raise AiServiceError(
                AiErrorCode.UNAUTHENTICATED,
                "GROQ_API_KEY or LLM_API_KEY is required for Groq LLM provider",
            )
        self.client = Groq(api_key=api_key)
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens

    def generate(self, prompt: str) -> LlmResponse:
        try:
            completion = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model,
                temperature=self.temperature,
                max_completion_tokens=self.max_tokens,
            )
        except Exception as exc:
            raise AiServiceError(
                AiErrorCode.UNAVAILABLE,
                f"Groq LLM request failed for model {self.model}: {exc}",
            ) from exc

        text = completion.choices[0].message.content or ""
        usage = completion.usage
        return LlmResponse(
            text=text,
            model=self.model,
            input_tokens=getattr(usage, "prompt_tokens", 0) if usage else 0,
            output_tokens=getattr(usage, "completion_tokens", 0) if usage else 0,
        )

    def stream(self, prompt: str) -> Iterable[str]:
        try:
            chunks = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model,
                temperature=self.temperature,
                max_completion_tokens=self.max_tokens,
                stream=True,
            )
            for chunk in chunks:
                if not chunk.choices:
                    continue
                content = chunk.choices[0].delta.content
                if content:
                    yield content
        except Exception as exc:
            raise AiServiceError(
                AiErrorCode.UNAVAILABLE,
                f"Groq LLM stream failed for model {self.model}: {exc}",
            ) from exc
