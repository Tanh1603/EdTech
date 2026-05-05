# BE-6 Chat Base: Session, Message, History (Mock AI)

## 1. Objective
Cung cấp chat API ổn định cho FE tích hợp sớm, dùng mock AI response.

## 2. Scope In / Out
### In Scope
- `GET/POST /chat/sessions`
- `GET/POST /chat/sessions/{sessionId}/messages`
- `POST /chat/sessions/{sessionId}/memory/reset`
- Lưu session/history/context tối thiểu.

### Out Scope
- AI service thật, routing agent thật.

## 3. API Contract Mapping
- Bám schema `ChatSession`, `ChatMessage`, `ChatResponse`.
- `POST messages` vẫn trả đầy đủ envelope + trường response giả lập.

## 4. Prisma/DB Changes
- Bảng: `chat_sessions`, `chat_messages`, `chat_citations`, `agent_runs` (optional mock trace).

## 5. Implementation Steps
1. Tạo `ChatModule`.
2. Implement create/list sessions.
3. Implement send message: lưu user msg -> tạo assistant msg mock.
4. Implement list history theo pagination.
5. Implement memory reset (xóa/đánh dấu context).

## 6. Acceptance Criteria
- FE có thể chat liên tục và xem lịch sử.
- Format response ổn định không đổi.

## 7. Test Cases
### Unit
- Chat response builder theo envelope.

### Integration
- Send message tạo đủ 2 message (user + assistant mock).

### E2E
- Session lifecycle + history + reset.

## 8. Deliverables
- Chat base APIs sẵn sàng tích hợp FE.
