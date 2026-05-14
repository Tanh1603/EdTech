import { UserRole } from '@edtech/contracts';

jest.mock('../../../common/auth/clerk-rbac-sync.service', () => ({
  ClerkRbacSyncService: class {},
}));

jest.mock('../../../common/rbac/rbac.mapper', () => ({
  toPermissionResponse: jest.fn((permission) => permission),
  toRoleResponse: jest.fn((role) => role),
  toUserResponse: jest.fn((user) => ({
    id: user.id,
    email: user.email,
    roles: user.roles ?? [],
    permissions: [],
    rbacVersion: user.rbacVersion ?? 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  })),
}));

jest.mock('../repositories/users.repository', () => ({
  UsersRepository: class {},
}));

import { UsersService } from './users.service';

describe('UsersService RBAC bootstrap', () => {
  const userId = 'user_1';

  let usersRepository: {
    upsertClerkUser: jest.Mock;
    ensureRole: jest.Mock;
    ensureDefaultRole: jest.Mock;
    findById: jest.Mock;
  };
  let clerkRbacSyncService: { syncUserRbacSnapshot: jest.Mock };
  let configService: { get: jest.Mock };
  let service: UsersService;

  beforeEach(() => {
    usersRepository = {
      upsertClerkUser: jest.fn().mockResolvedValue({ id: userId }),
      ensureRole: jest.fn().mockResolvedValue(true),
      ensureDefaultRole: jest.fn().mockResolvedValue(true),
      findById: jest.fn().mockResolvedValue({
        id: userId,
        email: 'admin@example.com',
        roles: [],
        rbacVersion: 1,
      }),
    };
    clerkRbacSyncService = {
      syncUserRbacSnapshot: jest.fn().mockResolvedValue({}),
    };
    configService = {
      get: jest.fn().mockReturnValue('admin@example.com, owner@example.com'),
    };
    service = new UsersService(
      usersRepository as any,
      clerkRbacSyncService as any,
      configService as any,
    );
  });

  it('assigns admin and syncs Clerk for allowlisted created users', async () => {
    await service.syncClerkUserCreated({
      id: userId,
      email: ' ADMIN@example.com ',
    });

    expect(usersRepository.ensureRole).toHaveBeenCalledWith(
      userId,
      UserRole.admin,
      { incrementRbacVersion: false },
    );
    expect(usersRepository.ensureDefaultRole).not.toHaveBeenCalled();
    expect(clerkRbacSyncService.syncUserRbacSnapshot).toHaveBeenCalledWith(
      userId,
    );
  });

  it('assigns student and syncs Clerk for non-allowlisted created users', async () => {
    await service.syncClerkUserCreated({
      id: userId,
      email: 'student@example.com',
    });

    expect(usersRepository.ensureDefaultRole).toHaveBeenCalledWith(
      userId,
      UserRole.student,
    );
    expect(usersRepository.ensureRole).not.toHaveBeenCalled();
    expect(clerkRbacSyncService.syncUserRbacSnapshot).toHaveBeenCalledWith(
      userId,
    );
  });

  it('adds admin, increments RBAC version, and syncs Clerk for allowlisted updated users', async () => {
    usersRepository.ensureRole.mockResolvedValue(true);

    await service.syncClerkUserUpdated({
      id: userId,
      email: 'owner@example.com',
    });

    expect(usersRepository.ensureRole).toHaveBeenCalledWith(
      userId,
      UserRole.admin,
      { incrementRbacVersion: true },
    );
    expect(clerkRbacSyncService.syncUserRbacSnapshot).toHaveBeenCalledWith(
      userId,
    );
  });

  it('does not duplicate admin or sync Clerk when an allowlisted updated user already has admin', async () => {
    usersRepository.ensureRole.mockResolvedValue(false);

    await service.syncClerkUserUpdated({
      id: userId,
      email: 'admin@example.com',
    });

    expect(usersRepository.ensureRole).toHaveBeenCalledWith(
      userId,
      UserRole.admin,
      { incrementRbacVersion: true },
    );
    expect(clerkRbacSyncService.syncUserRbacSnapshot).not.toHaveBeenCalled();
  });
});
