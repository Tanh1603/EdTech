import { Module } from '@nestjs/common';
import { ChatSharedModule } from '../shared/shared.module';
import { SessionsController } from './sessions.controller';

@Module({
  imports: [ChatSharedModule],
  controllers: [SessionsController],
})
export class SessionsModule {}
