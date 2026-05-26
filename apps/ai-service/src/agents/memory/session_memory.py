import json
from dataclasses import dataclass
from typing import Any, Protocol

from redis import Redis


class MemoryStore(Protocol):
    def set(self, key: str, value: Any, ttl_seconds: int | None = None) -> None: ...

    def get(self, key: str) -> Any | None: ...

    def delete(self, key: str) -> None: ...

    def increment(
        self,
        key: str,
        amount: int = 1,
        ttl_seconds: int | None = None,
    ) -> int: ...


@dataclass(frozen=True)
class MemoryKeyBuilder:
    prefix: str = "ai-service"

    def session_scratchpad(self, session_id: str) -> str:
        return f"{self.prefix}:session:{session_id}:scratchpad"

    def session_interactive(self, session_id: str) -> str:
        return f"{self.prefix}:session:{session_id}:interactive"

    def session_token_budget(self, session_id: str) -> str:
        return f"{self.prefix}:session:{session_id}:tokens"

    def job_state(self, job_id: str) -> str:
        return f"{self.prefix}:job:{job_id}:state"

class RedisSessionMemory:
    def __init__(self, redis_url: str) -> None:
        self.client: Redis = Redis.from_url(redis_url, decode_responses=True)

    def set(self, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        payload = json.dumps(value)
        self.client.set(name=key, value=payload, ex=ttl_seconds)

    def get(self, key: str) -> Any | None:
        payload = self.client.get(key)
        if payload is None:
            return None
        return json.loads(payload)

    def delete(self, key: str) -> None:
        self.client.delete(key)

    def increment(
        self,
        key: str,
        amount: int = 1,
        ttl_seconds: int | None = None,
    ) -> int:
        value = int(self.client.incrby(key, amount))
        if ttl_seconds and self.client.ttl(key) < 0:
            self.client.expire(key, ttl_seconds)
        return value
