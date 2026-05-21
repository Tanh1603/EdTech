# Phase 00: Python 3.14 Compatibility

## Goal

Keep `apps/ai-service` on standard CPython 3.14 with `uv` project metadata and
without free-threaded/no-GIL assumptions in V1.

## Status

Done as a project baseline. `pyproject.toml` requires `>=3.14,<3.15`, runtime
dependencies are Python 3.14 compatible, and `uv.lock` is scoped to Python
`3.14.*`.

## Related Modules

- `apps/ai-service/pyproject.toml`
- `apps/ai-service/uv.lock`
- `apps/ai-service/src/ai_service`

## Lib Dependencies

No app-local proto/schema source is defined. Contract compatibility depends on
`libs/contracts/proto` and generated Python modules in the AI service runtime.

## Verify

```sh
uv sync
npm exec nx lint ai-service
npm exec nx typecheck ai-service
```

## Next Step

Keep package additions small. Any new dependency must be checked for Python 3.14
wheel/build support before it becomes part of a runtime phase.

