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
    qdrant_url: str = Field(default="http://localhost:6334", alias="QDRANT_URL")
    rabbitmq_url: str = Field(default="amqp://localhost:5672", alias="RABBITMQ_URL")
    llm_provider: str = Field(default="fake", alias="LLM_PROVIDER")
    llm_api_key: str | None = Field(default=None, alias="LLM_API_KEY")
    embedding_provider: str = Field(default="fake", alias="EMBEDDING_PROVIDER")
    embedding_api_key: str | None = Field(default=None, alias="EMBEDDING_API_KEY")

    @property
    def is_local(self) -> bool:
        return self.environment == "local"

    def validate_runtime(self) -> None:
        if not self.is_local and not self.service_token:
            raise ValueError("SERVICE_TOKEN is required outside local development")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
