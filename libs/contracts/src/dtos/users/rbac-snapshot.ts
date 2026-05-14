import { RolePermission, RolePermissions, UserRole } from '../common';

export const RbacSnapshotVersion = 1;

export interface RbacSnapshot {
  v: typeof RbacSnapshotVersion;
  st: string;
  r: UserRole[];
  p: RolePermission[];
  rv: number;
  sa: string;
}

export interface RbacSnapshotClaims {
  sys?: {
    rbac?: unknown;
  };
}

export function parseRbacSnapshot(claims: unknown): RbacSnapshot | undefined {
  const rbac = (claims as RbacSnapshotClaims | undefined)?.sys?.rbac;
  if (!rbac || typeof rbac !== 'object') {
    return undefined;
  }

  const snapshot = rbac as Partial<RbacSnapshot>;
  const roles = normalizeRoles(snapshot.r);
  const permissions = normalizePermissions(snapshot.p);
  const rbacVersion = snapshot.rv;

  if (
    snapshot.v !== RbacSnapshotVersion ||
    typeof snapshot.st !== 'string' ||
    (snapshot.st === 'active' && roles.length === 0) ||
    !Number.isInteger(rbacVersion) ||
    typeof snapshot.sa !== 'string'
  ) {
    return undefined;
  }

  return {
    v: RbacSnapshotVersion,
    st: snapshot.st,
    r: roles,
    p: permissions,
    rv: rbacVersion as number,
    sa: snapshot.sa,
  };
}

export function createRbacSnapshot(input: {
  status: string;
  roles: UserRole[];
  permissions: RolePermission[];
  rbacVersion: number;
  syncedAt?: string;
}): RbacSnapshot {
  return {
    v: RbacSnapshotVersion,
    st: input.status,
    r: Array.from(new Set(input.roles)),
    p: Array.from(new Set(input.permissions)),
    rv: input.rbacVersion,
    sa: input.syncedAt ?? new Date().toISOString(),
  };
}

function normalizeRoles(value: unknown): UserRole[] {
  const rawRoles = Array.isArray(value) ? value : [];

  return Array.from(
    new Set(
      rawRoles
        .map((role) => String(role).trim())
        .filter((role): role is UserRole =>
          Object.values(UserRole).includes(role as UserRole),
        ),
    ),
  );
}

function normalizePermissions(value: unknown): RolePermission[] {
  const rawPermissions = Array.isArray(value) ? value : [];

  return Array.from(
    new Set(
      rawPermissions
        .map((permission) => String(permission).trim())
        .filter((permission): permission is RolePermission =>
          Object.values(RolePermissions).includes(permission as RolePermission),
        ),
    ),
  );
}
