# Phase 00: Python 3.14 Compatibility Gate

## Goal

Keep `apps/ai-service` on standard CPython 3.14 and detect dependency issues
before adding larger runtime code. Free-threaded/no-GIL Python builds are out of
V1.

## Implementation

- Keep `requires-python = ">=3.14,<3.15"` in `apps/ai-service/pyproject.toml`.
- Lock and install with `uv` using Python 3.14.
- Validate base dependencies: Pydantic Settings, grpcio, grpcio-tools,
  protobuf, RabbitMQ/Qdrant/Ollama clients, and ruff.
- If tests are restored later, add pytest back only after the compatibility gate
  passes on Python 3.14.
- If a package fails wheel/build support, upgrade to the newest compatible
  version; if it still fails, record the blocker in
  `docs/ai-service/references.md` and defer dependent phases.

## Acceptance

- `uv sync` works with Python 3.14.
- gRPC code generation runs.
- `npm exec nx lint ai-service` and `npm exec nx typecheck ai-service` pass.
- No business runtime phase depends on a package that has not passed this gate.

## References

- [Python 3.14 documentation](https://docs.python.org/3.14/)
- [What's New In Python 3.14](https://docs.python.org/3.14/whatsnew/3.14.html)
- [PEP 745: Python 3.14 Release Schedule](https://peps.python.org/pep-0745/)
- [uv project guide](https://docs.astral.sh/uv/guides/projects/)
