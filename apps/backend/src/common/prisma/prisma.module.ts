import { Global, Module } from '@nestjs/common';
import { AccessPolicyService } from '../access/access-policy.service';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [AccessPolicyService, PrismaService],
  exports: [AccessPolicyService, PrismaService],
})
export class PrismaModule {}
