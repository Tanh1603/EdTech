import { UserRole } from '@edtech/contracts';

export function normalizeUserRoles(value: unknown): UserRole[] {
  const rawRoles = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];

  const roles = rawRoles
    .map((role) => String(role).trim())
    .filter((role): role is UserRole =>
      Object.values(UserRole).includes(role as UserRole),
    );

  return Array.from(new Set(roles));
}

export function extractUserRolesFromClaims(payload: unknown): UserRole[] {
  const claims = payload as Record<string, unknown>;
  const candidates = [
    claims.roles,
    getNested(claims, 'publicMetadata', 'roles'),
    getNested(claims, 'privateMetadata', 'roles'),
    getNested(claims, 'public_metadata', 'roles'),
    getNested(claims, 'private_metadata', 'roles'),
    getNested(claims, 'metadata', 'roles'),
  ];

  for (const candidate of candidates) {
    const roles = normalizeUserRoles(candidate);
    if (roles.length > 0) {
      return roles;
    }
  }

  return [UserRole.student];
}

export function extractUserRolesFromClerkUser(user: unknown): UserRole[] {
  const clerkUser = user as Record<string, unknown>;
  const roles = [
    ...normalizeUserRoles(getNested(clerkUser, 'publicMetadata', 'roles')),
    ...normalizeUserRoles(getNested(clerkUser, 'privateMetadata', 'roles')),
  ];

  return roles.length > 0 ? Array.from(new Set(roles)) : [UserRole.student];
}

function getNested(
  source: Record<string, unknown>,
  key: string,
  nestedKey: string,
): unknown {
  const value = source[key];
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)[nestedKey]
    : undefined;
}
