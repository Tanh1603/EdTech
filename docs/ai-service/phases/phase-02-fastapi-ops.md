# Phase 02: Internal FastAPI Ops API

Status: Removed. AI Service now runs as gRPC + RabbitMQ worker only; HTTP ops
endpoints were removed because they were not part of chat, RAG, or worker
execution.

## Goal

This phase is retained only as historical context. HTTP ops endpoints were
removed; AI Service must not become a public browser-facing REST backend.

## Implementation

- Do not implement HTTP ops endpoints in V1.
- Run AI Service through `ai-service:grpc` and `ai-service:worker`.
- If deployment later needs health checks, add gRPC health instead of restoring
  an HTTP app.

## Acceptance

- No FastAPI/Uvicorn dependencies in `apps/ai-service`.
- Public AI routes remain owned by API Gateway and BE Core flows.
