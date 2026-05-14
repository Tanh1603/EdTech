import { createClerkClient, type ClerkClient } from '@clerk/backend';
import { RbacSnapshot } from '@edtech/contracts';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClerkRbacMetadataAdapter {
  private readonly logger = new Logger(ClerkRbacMetadataAdapter.name);
  private clerkClient?: ClerkClient;

  constructor(private readonly configService: ConfigService) {}

  async updateRbacSnapshot(
    userId: string,
    snapshot: RbacSnapshot,
  ): Promise<void> {
    const client = this.getClerkClient();
    const clerkUser = await client.users.getUser(userId);
    const privateMetadata = this.asRecord(clerkUser.privateMetadata);
    const sys = this.asRecord(privateMetadata.sys);

    await client.users.updateUserMetadata(userId, {
      privateMetadata: {
        ...privateMetadata,
        sys: {
          ...sys,
          rbac: snapshot,
        },
      },
    });

    this.logger.log(
      `Synced Clerk RBAC snapshot user=${userId} roles=${snapshot.r.join(',')} rv=${snapshot.rv}`,
    );
  }

  private getClerkClient(): ClerkClient {
    if (!this.clerkClient) {
      this.clerkClient = createClerkClient({
        secretKey: this.configService.getOrThrow<string>('CLERK_SECRET_KEY'),
      });
    }

    return this.clerkClient;
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }
}
