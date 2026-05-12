import { AiRealtimeEvents } from './realtime-events';

export interface AiErrorPayload {
  message: string;
  code?: string;
}

export interface AiChatTokenPayload {
  sessionId: string;
  text: string;
  isFinal?: boolean;
}

export interface AiProgressPayload {
  jobId: string;
  progress?: number;
  message?: string;
}

export interface AiRealtimePayloads {
  [AiRealtimeEvents.chatStarted]: unknown;
  [AiRealtimeEvents.chatToken]: AiChatTokenPayload;
  [AiRealtimeEvents.chatCompleted]: unknown;
  [AiRealtimeEvents.chatFailed]: AiErrorPayload;
  [AiRealtimeEvents.materialIngestStarted]: AiProgressPayload;
  [AiRealtimeEvents.materialIngestProgress]: AiProgressPayload;
  [AiRealtimeEvents.materialIngestCompleted]: AiProgressPayload;
  [AiRealtimeEvents.materialIngestFailed]: AiProgressPayload & { error?: AiErrorPayload };
  [AiRealtimeEvents.assessmentGradingStarted]: AiProgressPayload;
  [AiRealtimeEvents.assessmentGradingCompleted]: AiProgressPayload;
  [AiRealtimeEvents.assessmentGradingFailed]: AiProgressPayload & { error?: AiErrorPayload };
}

