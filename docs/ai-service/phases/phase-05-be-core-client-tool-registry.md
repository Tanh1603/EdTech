# Phase 05: BE Core Client And Local Tool Registry

## Goal

Create the BE Core client boundary and typed local tool registry that the
orchestrator and workers can call safely.

## Implementation

- Add a BE Core gRPC client wrapper with fake client support for offline
  verification.
- Place the wrapper under `ai_service/agents/clients`.
- Define V1 tool groups: `chat`, `materials`, `jobs`, `retrieval`, and
  `storage`.
- Place the local tool registry under `ai_service/agents/tools`.
- Each tool records name, input schema, permission context, timeout, and audit
  metadata.
- Do not use MCP in V1; keep typed tool contracts so MCP can wrap them later.

## Acceptance

- Fake tools can be registered and called deterministically.
- Audit events include `toolName`, `requestId`, `correlationId`, and `jobId`.
- Tool calls depend on delegated BE Core context, not direct database access.

## References

- [Model Context Protocol specification](https://modelcontextprotocol.io/specification/latest)
- [Toolformer paper](https://arxiv.org/abs/2302.04761)
- [ReAct paper](https://arxiv.org/abs/2210.03629)
