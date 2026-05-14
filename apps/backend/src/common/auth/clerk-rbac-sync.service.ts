import { createRbacSnapshot, RbacSnapshot } from '@edtech/contracts';
import { Injectable, NotFoundException } from '@nestjs/common';
import { RbacRepository } from '../rbac/rbac.repository';
import { UserRbacAuthority } from '../rbac/rbac.types';
import { ClerkRbacMetadataAdapter } from './clerk-rbac-metadata.adapter';

@Injectable()
export class ClerkRbacSyncService {
  constructor(
    private readonly rbacRepository: RbacRepository,
    private readonly clerkRbacMetadataAdapter: ClerkRbacMetadataAdapter,
  ) {}

  async getUserRbacAuthority(userId: string): Promise<UserRbacAuthority> {
    const authority = await this.rbacRepository.findUserAuthority(userId);
    if (!authority) {
      throw new NotFoundException('User not found');
    }

    return authority;
  }

  async syncUserRbacSnapshot(userId: string): Promise<RbacSnapshot> {
    const authority = await this.getUserRbacAuthority(userId);
    const snapshot = createRbacSnapshot({
      status: authority.status,
      roles: authority.roles,
      permissions: authority.permissions,
      rbacVersion: authority.rbacVersion,
    });

    await this.clerkRbacMetadataAdapter.updateRbacSnapshot(userId, snapshot);
    return snapshot;
  }
}
