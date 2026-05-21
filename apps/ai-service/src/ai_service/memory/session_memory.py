from dataclasses import dataclass, field
from time import time
from typing import Any


@dataclass
class MemoryValue:
    value: Any
    expires_at: float | None


@dataclass
class InMemorySessionMemory:
    values: dict[str, MemoryValue] = field(default_factory=dict)

    def set(self, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        expires_at = time() + ttl_seconds if ttl_seconds else None
        self.values[key] = MemoryValue(value=value, expires_at=expires_at)

    def get(self, key: str) -> Any | None:
        item = self.values.get(key)
        if not item:
            return None
        if item.expires_at and item.expires_at < time():
            self.values.pop(key, None)
            return None
        return item.value

    def increment(self, key: str, amount: int = 1) -> int:
        current = int(self.get(key) or 0) + amount
        self.set(key, current)
        return current
