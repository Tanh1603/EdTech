import {
  PageDto,
  SyncClerkUserDto,
  UserQueryDto,
  UserRole,
} from '@edtech/contracts';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  RoleWithPermissions,
  UserWithRbac,
  userRbacInclude,
} from '../../../common/rbac/rbac.mapper';
import { Permission, Prisma } from '../../../generated/prisma/client';

const DefaultUserStatus = 'active';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertClerkUser(
    payload: SyncClerkUserDto,
    defaultStatus = DefaultUserStatus,
  ): Promise<{ id: string }> {
    return this.prisma.user.upsert({
      where: { id: payload.id },
      create: {
        id: payload.id,
        email: payload.email ?? null,
        firstName: payload.firstName ?? null,
        lastName: payload.lastName ?? null,
        imageUrl: payload.imageUrl ?? null,
        status: payload.status ?? defaultStatus,
      },
      update: this.compactUserProfile({
        email: payload.email ?? null,
        firstName: payload.firstName ?? null,
        lastName: payload.lastName ?? null,
        imageUrl: payload.imageUrl ?? null,
        status: payload.status ?? defaultStatus,
      }),
      select: { id: true },
    });
  }

  async markDeleted(userId: string): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: userId },
      create: { id: userId, status: 'deleted' },
      update: { status: 'deleted', rbacVersion: { increment: 1 } },
    });
  }

  async updateProfile(
    userId: string,
    payload: {
      firstName?: string | null;
      lastName?: string | null;
      imageUrl?: string | null;
    },
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: this.compactUserProfile(payload),
    });
  }

  async findById(userId: string): Promise<UserWithRbac | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: userRbacInclude,
    });
  }

  async findPage(query: UserQueryDto): Promise<PageDto<UserWithRbac>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const role = query.role?.trim();
    const where: Prisma.UserWhereInput = {
      ...(search
        ? {
            OR: [
              { id: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(role
        ? {
            roles: {
              some: {
                roleName: role,
              },
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: userRbacInclude,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async exists(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    return Boolean(user);
  }

  async ensureDefaultRole(
    userId: string,
    roleName: UserRole,
  ): Promise<boolean> {
    const count = await this.prisma.userRoleAssignment.count({
      where: { userId },
    });

    if (count > 0) {
      return false;
    }

    return this.ensureRole(userId, roleName);
  }

  async ensureRole(
    userId: string,
    roleName: UserRole,
    options: { incrementRbacVersion?: boolean } = {},
  ): Promise<boolean> {
    const existing = await this.prisma.userRoleAssignment.findUnique({
      where: {
        userId_roleName: {
          userId,
          roleName,
        },
      },
    });

    if (existing) {
      return false;
    }

    const createRole = this.prisma.userRoleAssignment.create({
      data: { userId, roleName },
    });

    if (!options.incrementRbacVersion) {
      await createRole;
      return true;
    }

    await this.prisma.$transaction([
      createRole,
      this.prisma.user.update({
        where: { id: userId },
        data: { rbacVersion: { increment: 1 } },
      }),
    ]);

    return true;
  }

  async replaceRoles(userId: string, roles: UserRole[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.userRoleAssignment.deleteMany({
        where: { userId },
      }),
      this.prisma.userRoleAssignment.createMany({
        data: roles.map((roleName) => ({ userId, roleName })),
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { rbacVersion: { increment: 1 } },
      }),
    ]);
  }

  async findRoles(): Promise<RoleWithPermissions[]> {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findPermissions(): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      orderBy: { name: 'asc' },
    });
  }

  private compactUserProfile<T extends Record<string, unknown>>(value: T): T {
    return Object.fromEntries(
      Object.entries(value).filter(([, item]) => item !== undefined),
    ) as T;
  }
}
