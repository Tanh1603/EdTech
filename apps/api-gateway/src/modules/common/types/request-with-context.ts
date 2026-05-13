import { Request } from 'express';
import { UserRole } from '@edtech/contracts';

export interface RequestContext {
  requestId: string;
  correlationId: string;
  userId?: string;
  roles?: UserRole[];
  authorization?: string;
}

export type RequestWithContext = Request & {
  requestId?: string;
  correlationId?: string;
  user?: { id: string; roles?: UserRole[] };
  context?: RequestContext;
};
