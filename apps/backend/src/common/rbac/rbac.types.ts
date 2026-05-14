import { RolePermission, UserRole } from '@edtech/contracts';

export interface UserRbacAuthority {
  status: string;
  roles: UserRole[];
  permissions: RolePermission[];
  rbacVersion: number;
}
