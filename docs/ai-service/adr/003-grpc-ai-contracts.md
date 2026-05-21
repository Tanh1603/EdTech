# ADR-003: gRPC For Internal AI Contracts

## Decision

AI Service exposes internal typed APIs through gRPC and Protobuf under
`libs/contracts/proto/ai`.

## Reason

The repository already uses shared gRPC contracts between Gateway and BE Core.
AI Service needs the same typed boundary plus server streaming for token/state
streams.
