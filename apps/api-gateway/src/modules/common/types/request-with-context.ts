import { Request } from 'express';

export interface RequestContext {
  requestId: string;
  correlationId: string;
  userId?: string;
  authorization?: string;
}

export type RequestWithContext = Request & {
  requestId?: string;
  correlationId?: string;
  user?: { id: string };
  context?: RequestContext;
};
