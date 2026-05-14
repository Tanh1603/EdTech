import { Metadata, status } from '@grpc/grpc-js';
import { RolePermission, RolePermissions, UserRole } from '@edtech/contracts';
import { Reflector } from '@nestjs/core';
import { RpcException } from '@nestjs/microservices';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  const handler = jest.fn();
  const context = (metadata: Metadata) =>
    ({
      getType: () => 'rpc',
      getHandler: () => handler,
      getClass: () => class TestController {},
      switchToRpc: () => ({
        getContext: () => metadata,
        getData: () => ({}),
      }),
      getArgs: () => [{}, metadata],
    }) as any;

  function guard(required: RolePermission[] = [RolePermissions.usersManage]) {
    return new PermissionsGuard({
      getAllAndOverride: jest.fn().mockReturnValue(required),
    } as unknown as Reflector);
  }

  function metadata(input: {
    roles?: string;
    permissions?: string;
    userId?: string;
  }) {
    const value = new Metadata();
    value.set('x-user-id', input.userId ?? 'user-1');
    if (input.roles) value.set('x-user-roles', input.roles);
    if (input.permissions) value.set('x-user-permissions', input.permissions);
    return value;
  }

  it('allows users with the required permission', () => {
    expect(
      guard().canActivate(
        context(metadata({ permissions: RolePermissions.usersManage })),
      ),
    ).toBe(true);
  });

  it('allows users with any one required permission', () => {
    expect(
      guard([
        RolePermissions.learningRead,
        RolePermissions.lessonsManage,
      ]).canActivate(
        context(metadata({ permissions: RolePermissions.lessonsManage })),
      ),
    ).toBe(true);
  });

  it('allows admin even when permission is missing', () => {
    expect(
      guard().canActivate(context(metadata({ roles: UserRole.admin }))),
    ).toBe(true);
  });

  it('denies users missing the required permission', () => {
    expect(() =>
      guard().canActivate(
        context(metadata({ permissions: RolePermissions.learningRead })),
      ),
    ).toThrow(RpcException);
  });

  it('throws PERMISSION_DENIED when permission is missing', () => {
    try {
      guard().canActivate(
        context(metadata({ permissions: RolePermissions.learningRead })),
      );
      throw new Error('Expected guard to throw');
    } catch (error) {
      const response = (error as RpcException).getError() as {
        code: number;
        message: string;
      };
      expect(response).toEqual({
        code: status.PERMISSION_DENIED,
        message: 'Insufficient permission',
      });
    }
  });
});
