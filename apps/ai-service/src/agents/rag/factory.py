from agents.providers.factory import create_embedding_provider
from agents.rag import vector_stores
from agents.rag.retrieval import Retriever
from config.settings import Settings, get_settings


def create_vector_store(settings: Settings | None = None) -> vector_stores.VectorStore:
    active_settings = settings or get_settings()
    return vector_stores.QdrantVectorStore(
        url=active_settings.qdrant_url,
        collection_name=active_settings.qdrant_collection,
        grpc_port=active_settings.qdrant_grpc_port,
        prefer_grpc=active_settings.qdrant_prefer_grpc,
        api_key=active_settings.qdrant_api_key,
    )


def create_retriever(settings: Settings | None = None) -> Retriever:
    active_settings = settings or get_settings()
    return Retriever(
        provider=create_embedding_provider(active_settings),
        vector_store=create_vector_store(active_settings),
    )
