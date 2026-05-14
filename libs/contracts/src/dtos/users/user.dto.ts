import { RolePermission, UserRole } from '../common';

export type UserStatus = 'active' | 'deleted';

export interface UserSummaryDto {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  status: UserStatus | string;
}

export interface UserResponseDto {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  status: UserStatus | string;
  roles: UserRole[];
  permissions: RolePermission[];
  rbacVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoleResponseDto {
  id: UserRole;
  name: UserRole;
  description: string | null;
  permissions: RolePermission[];
}

export interface PermissionResponseDto {
  id: RolePermission;
  name: RolePermission;
  description: string | null;
}
