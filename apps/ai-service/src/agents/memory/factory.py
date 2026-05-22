from agents.memory.session_memory import MemoryKeyBuilder, MemoryStore, RedisSessionMemory
from config.settings import Settings, get_settings


def create_memory_store(settings: Settings | None = None) -> MemoryStore:
    active_settings = settings or get_settings()
    return RedisSessionMemory(active_settings.redis_url)


def create_memory_key_builder(settings: Settings | None = None) -> MemoryKeyBuilder:
    active_settings = settings or get_settings()
    return MemoryKeyBuilder(prefix=active_settings.redis_prefix)
