from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = Field(default="local", alias="ENVIRONMENT")
    ai_grpc_url: str = Field(alias="AI_GRPC_URL")
    be_core_grpc_url: str = Field(alias="BE_CORE_GRPC_URL")
    service_token: str = Field(alias="SERVICE_TOKEN")
    redis_url: str = Field(alias="REDIS_URL")
    redis_prefix: str = Field(default="ai-service", alias="REDIS_PREFIX")
    qdrant_url: str = Field(alias="QDRANT_URL")
    qdrant_grpc_port: int = Field(default=6334, alias="QDRANT_GRPC_PORT")
    qdrant_collection: str = Field(alias="QDRANT_COLLECTION")
    qdrant_prefer_grpc: bool = Field(default=True, alias="QDRANT_PREFER_GRPC")
    qdrant_api_key: str | None = Field(default=None, alias="QDRANT_API_KEY")
    rag_top_k_default: int = Field(default=5, alias="RAG_TOP_K_DEFAULT")
    rabbitmq_url: str = Field(alias="RABBITMQ_URL")
    rabbitmq_exchange: str = Field(default="edtech.jobs", alias="RABBITMQ_EXCHANGE")
    rabbitmq_prefetch: int = Field(default=10, alias="RABBITMQ_PREFETCH")
    llm_provider: str = Field(alias="LLM_PROVIDER")
    groq_api_key: str | None = Field(default=None, alias="GROQ_API_KEY")
    llm_api_key: str | None = Field(default=None, alias="LLM_API_KEY")
    llm_model: str = Field(alias="LLM_MODEL")
    llm_temperature: float = Field(default=0.2, alias="LLM_TEMPERATURE")
    llm_max_tokens: int = Field(default=1024, alias="LLM_MAX_TOKENS")
    be_core_grpc_timeout_seconds: float = Field(default=30.0, alias="BE_CORE_GRPC_TIMEOUT_SECONDS")
    embedding_provider: str = Field(alias="EMBEDDING_PROVIDER")
    embedding_batch_size: int = Field(default=32, alias="EMBEDDING_BATCH_SIZE")
    material_chunk_write_batch_size: int = Field(
        default=100,
        alias="MATERIAL_CHUNK_WRITE_BATCH_SIZE",
    )
    embedding_api_key: str | None = Field(default=None, alias="EMBEDDING_API_KEY")
    ollama_host: str = Field(alias="OLLAMA_HOST")
    embedding_model: str = Field(alias="EMBEDDING_MODEL")
    otel_service_name: str = Field(default="edtech-ai-service", alias="OTEL_SERVICE_NAME")
    otel_enabled: bool = Field(default=False, alias="OTEL_ENABLED")

    @property
    def is_local(self) -> bool:
        return self.environment == "local"

    def validate_runtime(self, runtime: Literal["grpc", "worker"]) -> None:
        required = {
            "AI_GRPC_URL": self.ai_grpc_url,
            "BE_CORE_GRPC_URL": self.be_core_grpc_url,
            "SERVICE_TOKEN": self.service_token,
            "REDIS_URL": self.redis_url,
            "QDRANT_URL": self.qdrant_url,
            "QDRANT_COLLECTION": self.qdrant_collection,
            "RABBITMQ_URL": self.rabbitmq_url,
            "LLM_PROVIDER": self.llm_provider,
            "LLM_MODEL": self.llm_model,
            "EMBEDDING_PROVIDER": self.embedding_provider,
            "OLLAMA_HOST": self.ollama_host,
            "EMBEDDING_MODEL": self.embedding_model,
        }
        missing = [name for name, value in required.items() if not value.strip()]
        if missing:
            raise ValueError(f"Missing required AI Service settings: {', '.join(missing)}")
        if self.llm_provider.lower() == "groq" and not self.effective_groq_api_key:
            raise ValueError("GROQ_API_KEY or LLM_API_KEY is required when LLM_PROVIDER=groq")
        if runtime == "worker" and self.embedding_provider.lower() != "ollama":
            raise ValueError("EMBEDDING_PROVIDER must be `ollama` for material ingestion")

    @property
    def effective_groq_api_key(self) -> str | None:
        return self.groq_api_key or self.llm_api_key


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
