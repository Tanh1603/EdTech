# Phase 01: Package Skeleton And Nx Targets

## Goal

Use a standard Python package layout and expose AI Service commands through Nx.

## Implementation

- Keep package code under `apps/ai-service/src/ai_service`.
- Use `src/ai_service/main.py` as the runtime entrypoint.
- Keep Nx targets for `serve`, `lint`, `typecheck`, and `proto:generate`.
- If the team decides to restore tests later, re-add a `test` target and
  minimal `tests/unit/test_health.py` baseline in the same phase.

## Acceptance

- `npm exec nx show project ai-service --json` shows the AI Service project.
- `npm exec nx lint ai-service` runs against `src`.
- `npm exec nx typecheck ai-service` compiles/checks `src`.
- `npm exec nx run ai-service:proto:generate` runs shared proto codegen.

## References

- [Nx project configuration](https://nx.dev/reference/project-configuration)
- [pytest fixtures](https://docs.pytest.org/en/stable/how-to/fixtures.html)

