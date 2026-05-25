from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = Field(default="local", alias="ENVIRONMENT")
    ai_grpc_url: str = Field(default="0.0.0.0:50052", alias="AI_GRPC_URL")
    be_core_grpc_url: str = Field(default="localhost:50051", alias="BE_CORE_GRPC_URL")
    service_token: str | None = Field(default=None, alias="SERVICE_TOKEN")
    redis_url: str = Field(default="redis://localhost:6379", alias="REDIS_URL")
    redis_prefix: str = Field(default="ai-service", alias="REDIS_PREFIX")
    qdrant_url: str = Field(default="http://localhost:6333", alias="QDRANT_URL")
    qdrant_grpc_port: int = Field(default=6334, alias="QDRANT_GRPC_PORT")
    qdrant_collection: str = Field(
        default="ai_material_chunks",
        alias="QDRANT_COLLECTION",
    )
    qdrant_prefer_grpc: bool = Field(default=True, alias="QDRANT_PREFER_GRPC")
    rag_top_k_default: int = Field(default=5, alias="RAG_TOP_K_DEFAULT")
    rabbitmq_url: str = Field(default="amqp://localhost:5672", alias="RABBITMQ_URL")
    rabbitmq_exchange: str = Field(default="edtech.jobs", alias="RABBITMQ_EXCHANGE")
    rabbitmq_prefetch: int = Field(default=10, alias="RABBITMQ_PREFETCH")
    llm_provider: str = Field(default="groq", alias="LLM_PROVIDER")
    llm_api_key: str | None = Field(default=None, alias="LLM_API_KEY")
    groq_api_key: str | None = Field(default=None, alias="GROQ_API_KEY")
    llm_model: str = Field(default="llama-3.3-70b-versatile", alias="LLM_MODEL")
    llm_temperature: float = Field(default=0.2, alias="LLM_TEMPERATURE")
    llm_max_tokens: int = Field(default=1024, alias="LLM_MAX_TOKENS")
    embedding_provider: str = Field(default="ollama", alias="EMBEDDING_PROVIDER")
    embedding_api_key: str | None = Field(default=None, alias="EMBEDDING_API_KEY")
    ollama_host: str = Field(default="http://localhost:11434", alias="OLLAMA_HOST")
    embedding_model: str = Field(default="nomic-embed-text", alias="EMBEDDING_MODEL")
    otel_service_name: str = Field(default="edtech-ai-service", alias="OTEL_SERVICE_NAME")
    otel_enabled: bool = Field(default=False, alias="OTEL_ENABLED")

    @property
    def is_local(self) -> bool:
        return self.environment == "local"

    def validate_runtime(self) -> None:
        if not self.is_local and not self.service_token:
            raise ValueError("SERVICE_TOKEN is required outside local development")
        if not self.is_local and self.llm_provider == "groq" and not self.effective_groq_api_key:
            raise ValueError("GROQ_API_KEY or LLM_API_KEY is required when LLM_PROVIDER=groq")

    @property
    def effective_groq_api_key(self) -> str | None:
        return self.groq_api_key or self.llm_api_key


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
