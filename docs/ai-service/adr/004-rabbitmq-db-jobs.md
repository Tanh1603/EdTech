# ADR-004: RabbitMQ Plus DB Jobs

## Decision

Long-running AI work uses RabbitMQ for delivery and BE Core `jobs` for durable
status and audit.

## Reason

Material ingestion, grading, roadmap generation, and recommendation refresh need
retry, DLQ, and worker scaling. Clients need queryable job status, which belongs
in BE Core rather than the queue.
