from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any

from opentelemetry import trace


@contextmanager
def span(name: str, attributes: dict[str, Any] | None = None) -> Iterator[None]:
    tracer = trace.get_tracer("edtech.ai-service")
    with tracer.start_as_current_span(name) as active_span:
        for key, value in (attributes or {}).items():
            if value is not None:
                active_span.set_attribute(key, value)
        yield
