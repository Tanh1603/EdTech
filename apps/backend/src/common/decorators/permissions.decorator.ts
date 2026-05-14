import { RolePermission } from '@edtech/contracts';
import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: RolePermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
