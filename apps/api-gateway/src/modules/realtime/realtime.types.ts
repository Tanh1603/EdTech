import { Socket } from 'socket.io';

export interface RealtimeSocketData {
  userId: string;
  authorization: string;
  requestId: string;
  correlationId: string;
}

export type AuthenticatedRealtimeSocket = Socket & {
  data: RealtimeSocketData;
};

export interface RealtimeSubscribePayload {
  sessionId?: string;
  classId?: string;
  examId?: string;
  submissionId?: string;
  jobId?: string;
}

export interface RealtimePublishContext {
  requestId?: string;
  correlationId?: string;
}
