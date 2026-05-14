import { Request } from 'express';
import { RolePermission, UserRole } from '@edtech/contracts';

export interface RequestContext {
  requestId: string;
  correlationId: string;
  userId?: string;
  roles?: UserRole[];
  permissions?: RolePermission[];
}

export type RequestWithContext = Request & {
  requestId?: string;
  correlationId?: string;
  user?: { id: string; roles?: UserRole[]; permissions?: RolePermission[] };
  context?: RequestContext;
};
