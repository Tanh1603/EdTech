import { Global, Module } from '@nestjs/common';
import { GrpcUserAuthGuard } from '../guards/grpc-user-auth.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacRepository } from '../rbac/rbac.repository';
import { ClerkRbacMetadataAdapter } from './clerk-rbac-metadata.adapter';
import { ClerkRbacSyncService } from './clerk-rbac-sync.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    RbacRepository,
    ClerkRbacMetadataAdapter,
    ClerkRbacSyncService,
    GrpcUserAuthGuard,
  ],
  exports: [RbacRepository, ClerkRbacSyncService, GrpcUserAuthGuard],
})
export class BackendAuthModule {}
