import {
  PageDto,
  PermissionResponseDto,
  RoleResponseDto,
  SyncClerkUserDto,
  UpdateUserProfileDto,
  UserQueryDto,
  UserResponseDto,
  UserRole,
} from '@edtech/contracts';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClerkRbacSyncService } from '../../../common/auth/clerk-rbac-sync.service';
import {
  toPermissionResponse,
  toRoleResponse,
  toUserResponse,
} from '../../../common/rbac/rbac.mapper';
import { UsersRepository } from '../repositories/users.repository';

const DefaultUserRole = UserRole.student;
const BootstrapAdminEmailsEnv = 'RBAC_BOOTSTRAP_ADMIN_EMAILS';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly clerkRbacSyncService: ClerkRbacSyncService,
    private readonly configService: ConfigService,
  ) {}

  async syncClerkUserCreated(
    payload: SyncClerkUserDto,
  ): Promise<UserResponseDto> {
    this.assertSyncPayload(payload);
    const user = await this.usersRepository.upsertClerkUser(payload, 'active');
    await this.ensureBootstrapRole(user.id, payload.email, {
      incrementAdminRbacVersion: false,
    });
    await this.clerkRbacSyncService.syncUserRbacSnapshot(user.id);
    return this.getUserById(user.id);
  }

  async syncClerkUserUpdated(
    payload: SyncClerkUserDto,
  ): Promise<UserResponseDto> {
    this.assertSyncPayload(payload);
    const user = await this.usersRepository.upsertClerkUser(
      payload,
      payload.status ?? 'active',
    );
    const roleChanged = await this.ensureBootstrapRole(user.id, payload.email, {
      incrementAdminRbacVersion: true,
    });
    if (roleChanged) {
      await this.clerkRbacSyncService.syncUserRbacSnapshot(user.id);
    }
    return this.getUserById(user.id);
  }

  async syncClerkUserDeleted(userId: string): Promise<UserResponseDto> {
    await this.usersRepository.markDeleted(userId);
    return this.getUserById(userId);
  }

  async getMe(userId: string): Promise<UserResponseDto> {
    return this.getUserById(userId);
  }

  async updateMyProfile(
    userId: string,
    payload: UpdateUserProfileDto,
  ): Promise<UserResponseDto> {
    await this.usersRepository.updateProfile(userId, {
      firstName: payload.firstName,
      lastName: payload.lastName,
      imageUrl: payload.imageUrl,
    });

    return this.getUserById(userId);
  }

  async getUsers(query: UserQueryDto): Promise<PageDto<UserResponseDto>> {
    const page = await this.usersRepository.findPage(query);
    console.log(page);

    return {
      ...page,
      items: page.items.map(toUserResponse),
    };
  }

  async assignUserRoles(
    userId: string,
    roles: UserRole[],
  ): Promise<UserResponseDto> {
    const uniqueRoles = Array.from(new Set(roles));
    this.assertValidRoles(uniqueRoles);

    if (!(await this.usersRepository.exists(userId))) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepository.replaceRoles(userId, uniqueRoles);
    await this.clerkRbacSyncService.syncUserRbacSnapshot(userId);
    return this.getUserById(userId);
  }

  async getRoles(): Promise<RoleResponseDto[]> {
    const roles = await this.usersRepository.findRoles();
    return roles.map(toRoleResponse);
  }

  async getPermissions(): Promise<PermissionResponseDto[]> {
    const permissions = await this.usersRepository.findPermissions();
    return permissions.map(toPermissionResponse);
  }

  private async getUserById(userId: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return toUserResponse(user);
  }

  private assertSyncPayload(payload: SyncClerkUserDto): void {
    if (!payload.id) {
      throw new BadRequestException('Missing Clerk user id');
    }
  }

  private assertValidRoles(roles: UserRole[]): void {
    const allowedRoles = new Set(Object.values(UserRole));
    const invalidRoles = roles.filter((role) => !allowedRoles.has(role));

    if (invalidRoles.length > 0) {
      throw new BadRequestException(
        `Invalid roles: ${invalidRoles.join(', ')}`,
      );
    }
  }

  private async ensureBootstrapRole(
    userId: string,
    email: string | null | undefined,
    options: { incrementAdminRbacVersion: boolean },
  ): Promise<boolean> {
    if (this.isBootstrapAdminEmail(email)) {
      return this.usersRepository.ensureRole(userId, UserRole.admin, {
        incrementRbacVersion: options.incrementAdminRbacVersion,
      });
    }

    return this.usersRepository.ensureDefaultRole(userId, DefaultUserRole);
  }

  private isBootstrapAdminEmail(email: string | null | undefined): boolean {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail) {
      return false;
    }

    return this.getBootstrapAdminEmails().has(normalizedEmail);
  }

  private getBootstrapAdminEmails(): Set<string> {
    const rawValue =
      this.configService.get<string>(BootstrapAdminEmailsEnv) ?? '';

    return new Set(
      rawValue
        .split(',')
        .map((email) => this.normalizeEmail(email))
        .filter((email): email is string => Boolean(email)),
    );
  }

  private normalizeEmail(email: string | null | undefined): string | undefined {
    const normalized = email?.trim().toLowerCase();
    return normalized && normalized.length > 0 ? normalized : undefined;
  }
}
