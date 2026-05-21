from typing import Protocol

from grpc.errors import AiErrorCode, AiServiceError
from ollama import Client


class EmbeddingProvider(Protocol):
    def embed(self, text: str) -> list[float]:
        raise NotImplementedError


class OllamaEmbeddingProvider:
    def __init__(self, host: str, model: str) -> None:
        self.client = Client(host=host)
        self.host = host
        self.model = model

    def embed(self, text: str) -> list[float]:
        try:
            response = self.client.embed(model=self.model, input=text)
        except Exception as exc:
            raise AiServiceError(
                AiErrorCode.UNAVAILABLE,
                "Ollama embedding request failed. Ensure Ollama is running and run "
                f"`ollama pull {self.model}`.",
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
