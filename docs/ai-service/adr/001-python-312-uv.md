# ADR-001: Python 3.12 And uv

## Decision

AI Service targets Python 3.12 and uses `uv` for dependency management.

## Reason

Python 3.12 has broad AI library support and is safer for CI/deploy than Python
3.14. `uv` keeps local installs and lockfile management fast without requiring a
larger packaging framework.
