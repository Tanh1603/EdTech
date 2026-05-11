# Phase 4: Chat Module

## Goal

Implement tests for chat sessions, messages, ownership, classroom analytics, and deterministic AI response behavior.

## Public Contract Source

- `docs/api-contract/gateway.md`
- `docs/api-contract/chat.md`
- `docs/flow/ai-chat.puml`
- `docs/flow/learning.puml`

## Implementation Order

1. Session lifecycle.
2. Message list/send/detail/delete.
3. Ownership and classroom access.
4. Chat analytics.
5. AI response stub.
6. Streaming tests when SSE/WebSocket support is implemented.

## API Gateway E2E Files

```txt
apps/api-gateway-e2e/src/chat/sessions.e2e-spec.ts
apps/api-gateway-e2e/src/chat/messages.e2e-spec.ts
apps/api-gateway-e2e/src/chat/analytics.e2e-spec.ts
apps/api-gateway-e2e/src/flows/chat-tutor.e2e-spec.ts
```

## Gateway Unit/Integration Files

```txt
apps/api-gateway/src/modules/chat/*.spec.ts
apps/api-gateway/src/modules/chat/*.integration.spec.ts
```

## Backend Whitebox Files

```txt
apps/backend/src/modules/chat/sessions/*.spec.ts
apps/backend/src/modules/chat/messages/*.spec.ts
apps/backend/src/modules/chat/shared/*.spec.ts
```

## Blackbox Cases

| Area | Cases |
| --- | --- |
| Sessions | create, list own sessions, detail, rename, delete |
| Session filters | filter by class, search, pagination |
| Messages | list by session, send message, get message detail, delete |
| AI response | send message returns persisted user message and deterministic assistant response/stub |
| Ownership | another user cannot read/update/delete session or message |
| Classroom scope | user cannot create/read chat for classroom they do not belong to |
| Analytics | user analytics for self; classroom analytics for teacher only |
| Validation | empty content, invalid UUID, title too long, invalid pagination/cursor |

## Whitebox Cases

| Service rule | Cases |
| --- | --- |
| Session ownership | all session operations scope by current user |
| Classroom membership | class chat requires enrollment/teacher ownership |
| Message ordering | messages are sorted by creation/cursor consistently |
| Delete behavior | deleted session hides messages or marks them inaccessible according to implementation |
| AI stub | test mode returns deterministic assistant message without real provider |
| Analytics | counts sessions/messages and handles empty state |

## E2E Flow

1. Student creates chat session.
2. Student sends a message.
3. API returns user message and assistant response/stub.
4. Student lists message history.
5. Student renames session.
6. Another student cannot access the session.
7. Teacher views classroom chat analytics where authorized.

## Future Streaming Cases

Add these only after streaming route exists:

- SSE sends `token` events and a final `done`.
- Stream errors still include request ID.
- Client disconnect cancels downstream stream.
- Token budget/rate limit errors map to `429`.

## Done Criteria

- Chat session/message CRUD is covered.
- Cross-user isolation is covered.
- AI behavior is deterministic in CI and does not require provider secrets.

