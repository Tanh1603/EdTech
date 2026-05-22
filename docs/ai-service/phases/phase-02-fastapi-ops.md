# Phase 02: Internal FastAPI Ops API

## Goal

Expose internal operational HTTP endpoints only. AI Service must not become a
public browser-facing REST backend.

## Implementation

- Implement FastAPI app for `/health`, `/ready`, and `/metrics`.
- `/health` reports process liveness.
- `/ready` checks minimal config and later expands to dependency readiness.
- `/metrics` returns an early placeholder in text/plain or JSON format.
- Do not expose public chat, grading, roadmap, or RAG REST endpoints.

## Acceptance

- `uv run uvicorn --app-dir src main:app` boots the ops API.
- `/health` and `/ready` respond locally.
- Public AI routes remain owned by API Gateway and BE Core flows.

## References

- [FastAPI first steps](https://fastapi.tiangolo.com/tutorial/first-steps/)
- [FastAPI deployment](https://fastapi.tiangolo.com/deployment/)
