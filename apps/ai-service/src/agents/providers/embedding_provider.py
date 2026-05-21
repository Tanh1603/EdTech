from typing import Protocol

from ollama import Client

from agents.grpc.errors import AiErrorCode, AiServiceError


class EmbeddingProvider(Protocol):
    def embed(self, text: str) -> list[float]: ...


class OllamaEmbeddingProvider(EmbeddingProvider):
    def __init__(
        self,
        host: str,
        model: str,
        api_key: str | None = None,
    ) -> None:
        headers: dict[str, str] = {}

        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        self.client = Client(
            host=host,
            headers=headers,
        )

        self.host = host
        self.model = model

    def embed(self, text: str) -> list[float]:
        try:
            response = self.client.embed(
                model=self.model,
                input=text,
            )
        except Exception as exc:
            raise AiServiceError(
                AiErrorCode.UNAVAILABLE,
                f"Ollama embedding request failed for model {self.model}: {exc}",
            ) from exc

        embeddings = (
            response.get("embeddings")
            if isinstance(response, dict)
            else response.embeddings
        )

        if not embeddings:
            raise AiServiceError(
                AiErrorCode.INTERNAL,
                f"Ollama returned no embeddings for model {self.model}",
            )

        return [float(value) for value in embeddings[0]]
