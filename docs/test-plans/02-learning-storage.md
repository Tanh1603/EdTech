# Phase 2: Learning and Storage Module

## Goal

Implement tests for storage upload, learning materials, chunks, roadmaps, roadmap items, progress, and mastery.

## Public Contract Source

- `docs/api-contract/gateway.md`
- `docs/api-contract/learning.md`
- `docs/flow/learning.puml`
- `docs/flow/adaptive.puml`

## Implementation Order

1. Storage upload.
2. Material metadata CRUD.
3. Material chunks.
4. Roadmap CRUD.
5. Roadmap items and progress.
6. Mastery reads/writes.
7. Material upload-to-ready flow with job/worker stub.

## API Gateway E2E Files

```txt
apps/api-gateway-e2e/src/learning/storage.e2e-spec.ts
apps/api-gateway-e2e/src/learning/materials.e2e-spec.ts
apps/api-gateway-e2e/src/learning/roadmaps.e2e-spec.ts
apps/api-gateway-e2e/src/learning/mastery.e2e-spec.ts
apps/api-gateway-e2e/src/flows/material-ingestion.e2e-spec.ts
apps/api-gateway-e2e/src/flows/roadmap-mastery.e2e-spec.ts
```

## Gateway Unit/Integration Files

```txt
apps/api-gateway/src/modules/storage/*.spec.ts
apps/api-gateway/src/modules/learning/*.spec.ts
apps/api-gateway/src/modules/learning/*.integration.spec.ts
```

## Backend Whitebox Files

```txt
apps/backend/src/modules/learning/materials/*.spec.ts
apps/backend/src/modules/learning/roadmaps/*.spec.ts
apps/backend/src/modules/learning/mastery/*.spec.ts
apps/backend/src/modules/storage/*.spec.ts
```

## Blackbox Cases

| Area | Cases |
| --- | --- |
| Storage | upload multipart file, reject missing file, reject unsupported/oversized file if configured |
| Materials | create metadata after upload, list by lesson/status/search, detail, update, delete |
| Metadata-only rule | reject sending raw file bytes to `/api/learning/materials` |
| Chunks | list chunks with pagination, get chunk detail, missing chunk returns `404` |
| Roadmaps | create, list by status, detail, update title/status, delete |
| Roadmap items | add item, update item, complete, uncomplete, delete |
| Progress | completed count and percent are correct |
| Next item | returns next incomplete item or empty state |
| Mastery | student views own mastery, teacher views class mastery, topic history, analytics, risk students |
| Mastery writes | normal users rejected from system-only upsert/bulk upsert |

## Whitebox Cases

| Service rule | Cases |
| --- | --- |
| Material status | valid transitions: uploaded -> indexing -> ready/failed |
| Material ownership | only authorized teacher can mutate material |
| Chunk visibility | chunks hidden until material is ready if product requires it |
| Roadmap progress | handles zero items, all complete, partial complete |
| Roadmap ordering | `orderNo` is positive and deterministic |
| Mastery score | accepts `0..1`, rejects out-of-range values |
| Bulk mastery | transaction behavior on partial invalid payload |

## E2E Flow: Material Ingestion

1. Teacher uploads a file through `/api/storage/upload`.
2. Teacher creates material metadata through `/api/learning/materials`.
3. API returns material with `uploaded` or `indexing`.
4. Job status is queryable if async job is created.
5. Test stub marks material `ready`.
6. Chunks are listable and chunk detail is accessible.

## E2E Flow: Roadmap and Mastery

1. Student creates roadmap.
2. Student adds items.
3. Student completes one item.
4. Progress endpoint reflects completion.
5. System/stub upserts mastery.
6. Teacher views class mastery/risk students.

## Done Criteria

- Storage and material metadata contract is protected against binary misuse.
- Roadmap progress has edge-case coverage.
- Mastery authorization is covered.
- Material ingestion flow is deterministic with stubs until AI workers exist.

