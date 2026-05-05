import { Module } from '@nestjs/common';
import { OpsController } from './controllers/ops.controller';
import { OpsService } from './services/ops.service';

@Module({
  controllers: [OpsController],
  providers: [OpsService],
})
export class OpsModule {}

