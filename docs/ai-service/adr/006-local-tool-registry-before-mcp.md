# ADR-006: Local Tool Registry Before MCP

## Decision

V1 uses a local typed tool registry. MCP can be added later around the same tool
contracts.

## Reason

Typed local tools are simpler to test and audit. They keep V1 focused on material
ingestion, chat, grading, and roadmap flows without committing early to MCP
runtime complexity.
