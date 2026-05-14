import {
  PermissionResponseDto,
  RolePermission,
  RoleResponseDto,
  UserResponseDto,
  UserRole,
  UserSummaryDto,
} from '@edtech/contracts';
import { Permission, Prisma } from '../../generated/prisma/client';
import { UserRbacAuthority } from './rbac.types';

export const userRbacInclude = {
  roles: {
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  },
} as const;

export const userSummarySelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  imageUrl: true,
  status: true,
} as const;

export type UserWithRbac = Prisma.UserGetPayload<{
  include: typeof userRbacInclude;
}>;

export type UserSummaryShape = Prisma.UserGetPayload<{
  select: typeof userSummarySelect;
}>;

export type RoleWithPermissions = Prisma.RoleGetPayload<{
  include: {
    permissions: {
      include: {
        permission: true;
      };
    };
  };
}>;

export function toUserRbacAuthority(user: UserWithRbac): UserRbacAuthority {
  const roles = user.roles.map((assignment) => assignment.role.name);
  const permissions = uniquePermissions(user);

  return {
    status: user.status,
    roles: roles as UserRole[],
    permissions,
    rbacVersion: user.rbacVersion,
  };
}

export function toUserResponse(user: UserWithRbac): UserResponseDto {
  const authority = toUserRbacAuthority(user);

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    status: user.status,
    roles: authority.roles,
    permissions: authority.permissions,
    rbacVersion: authority.rbacVersion,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function toUserSummary(
  user?: UserSummaryShape | null,
): UserSummaryDto | undefined {
  if (!user) {
    return undefined;
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    status: user.status,
  };
}

export function toRoleResponse(role: RoleWithPermissions): RoleResponseDto {
  return {
    id: role.name as UserRole,
    name: role.name as UserRole,
    description: role.description,
    permissions: role.permissions.map(
      (rolePermission) => rolePermission.permission.name as RolePermission,
    ),
  };
}

export function toPermissionResponse(
  permission: Permission,
): PermissionResponseDto {
  return {
    id: permission.name as RolePermission,
    name: permission.name as RolePermission,
    description: permission.description,
  };
}

function uniquePermissions(user: UserWithRbac): RolePermission[] {
  return Array.from(
    new Set(
      user.roles.flatMap((assignment) =>
        assignment.role.permissions.map(
          (rolePermission) => rolePermission.permission.name,
        ),
      ),
    ),
  ) as RolePermission[];
}
