# ADR-001: Python 3.14 And uv

## Decision

AI Service targets standard CPython 3.14 and uses `uv` for dependency
management. Free-threaded/no-GIL Python builds are explicitly out of V1.

## Reason

Python 3.14 is the requested runtime for this service. Because some AI and
infrastructure packages may lag behind new Python releases, Phase 0 must verify
dependency install, lint/typecheck, and gRPC code generation before implementing
larger runtime features. `uv` keeps lock/install workflow fast and reproducible.
