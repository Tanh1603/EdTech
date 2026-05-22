from agents.grpc.errors import AiErrorCode, AiServiceError
from agents.providers.embedding_provider import (
    EmbeddingProvider,
    OllamaEmbeddingProvider,
)
from agents.providers.llm_provider import GroqLlmProvider, LlmProvider
from config.settings import Settings, get_settings


def create_llm_provider(settings: Settings | None = None) -> LlmProvider:
    settings = settings or get_settings()
    provider = settings.llm_provider.lower()
    if provider == "groq":
        return GroqLlmProvider(
            api_key=settings.effective_groq_api_key or "",
            model=settings.llm_model,
            temperature=settings.llm_temperature,
            max_tokens=settings.llm_max_tokens,
        )
    raise AiServiceError(
        AiErrorCode.INVALID_ARGUMENT,
        f"Unsupported LLM_PROVIDER `{settings.llm_provider}`",
    )


def create_embedding_provider(settings: Settings | None = None) -> EmbeddingProvider:
    settings = settings or get_settings()
    provider = settings.embedding_provider.lower()
    if provider == "ollama":
        return OllamaEmbeddingProvider(
            host=settings.ollama_host,
            model=settings.embedding_model,
            api_key=settings.embedding_api_key,
        )
    raise AiServiceError(
        AiErrorCode.INVALID_ARGUMENT,
        f"Unsupported EMBEDDING_PROVIDER `{settings.embedding_provider}`",
    )
