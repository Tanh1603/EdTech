# Phase 01: Package And Nx

## Goal

Use a normal Python package layout under `src/ai_service` and expose AI Service
tasks through Nx.

## Status

Done. The service has `src/ai_service`, a FastAPI entrypoint, package modules,
and Nx targets for `serve`, `lint`, `typecheck`, and `proto:generate`. The local
`test` target has been removed by design.

## Related Modules

- `apps/ai-service/project.json`
- `apps/ai-service/src/ai_service/main.py`
- `apps/ai-service/README.md`

## Lib Dependencies

Nx only orchestrates the app tasks. Shared contract ownership stays in
`libs/contracts`, and the AI service consumes those contracts through generated
Python modules.

## Verify

```sh
npm exec nx show project ai-service --json
npm exec nx lint ai-service
npm exec nx typecheck ai-service
```

## Next Step

Keep future targets explicit and internal-service focused. Do not add public API
targets for browser-facing AI routes in this app.

