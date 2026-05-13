import { Module } from '@nestjs/common';
import { ChatSharedModule } from './shared/shared.module';

@Module({
  imports: [ChatSharedModule],
})
export class ChatModule {}
