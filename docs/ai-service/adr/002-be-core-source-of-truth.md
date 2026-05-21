# ADR-002: BE Core Remains Source Of Truth

## Decision

AI Service does not write LMS domain tables directly. It reads context and
persists final AI outputs through BE Core gRPC.

## Reason

BE Core already owns Prisma schema rules, authorization, audit, and domain
invariants. Keeping writes behind BE Core prevents duplicate business logic and
schema drift.
