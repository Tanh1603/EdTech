from typing import Protocol

from ollama import Client

from agents.grpc.errors import AiErrorCode, AiServiceError


class EmbeddingProvider(Protocol):
    def embed(self, text: str) -> list[float]: ...

    def embed_many(self, texts: list[str]) -> list[list[float]]: ...


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
        return self.embed_many([text])[0]

    def embed_many(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        try:
            response = self.client.embed(
                model=self.model,
                input=texts,
            )
        except Exception as exc:
            raise AiServiceError(
                AiErrorCode.UNAVAILABLE,
                "Ollama embedding request failed "
                f"(host={self.host}, model={self.model}). "
                f"Verify Ollama is running and run `ollama pull {self.model}`. "
                f"Cause: {exc}",
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

        return [[float(value) for value in embedding] for embedding in embeddings]
