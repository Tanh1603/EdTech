# Phase 09: RabbitMQ Worker Foundation

## Goal

Create a reliable worker loop for async AI jobs without allowing workers to
write LMS database tables directly.

## Implementation

- Connect to RabbitMQ.
- Keep worker modules under `ai_service/agents/workers`.
- Consume messages and validate payloads.
- Mark jobs running through BE Core.
- Process jobs and mark succeeded/failed through BE Core.
- Implement ack/nack, retry metadata, and graceful shutdown.
- Keep fake queue/BE clients for offline verification.

## Acceptance

- Queued job transitions to running.
- Success path marks the job succeeded and acknowledges the message.
- Failure path marks the job failed and applies retry/nack policy.
- Worker status updates go through BE Core client wrappers.

## References

- [RabbitMQ Python Work Queues](https://www.rabbitmq.com/tutorials/tutorial-two-python)
- [RabbitMQ tutorials](https://www.rabbitmq.com/tutorials)
