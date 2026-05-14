import { Socket } from 'socket.io';
import { RolePermission, UserRole } from '@edtech/contracts';

export interface RealtimeSocketData {
  userId: string;
  roles: UserRole[];
  permissions: RolePermission[];
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
