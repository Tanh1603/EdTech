import { Module } from '@nestjs/common';
import { OpsController } from './controllers/ops.controller';
import { OpsService } from './services/ops.service';
import { ClerkClientProvider } from '../../common/providers/clerk-client.provider';

@Module({
  controllers: [OpsController],
  providers: [OpsService, ClerkClientProvider],
})
export class OpsModule {}

