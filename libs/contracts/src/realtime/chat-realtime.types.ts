import { ChatRealtimeEvents } from './realtime-events';

export interface ChatSessionDeletedPayload {
  sessionId: string;
}

export interface ChatMessageDeletedPayload {
  messageId: string;
}

export interface ChatRealtimePayloads {
  [ChatRealtimeEvents.sessionCreated]: unknown;
  [ChatRealtimeEvents.sessionUpdated]: unknown;
  [ChatRealtimeEvents.sessionDeleted]: ChatSessionDeletedPayload;
  [ChatRealtimeEvents.messageCreated]: unknown;
  [ChatRealtimeEvents.messageDeleted]: ChatMessageDeletedPayload;
}

