import { Module } from '@nestjs/common';
import { ChatSharedModule } from '../shared/shared.module';
import { MessagesController } from './messages.controller';

@Module({
  imports: [ChatSharedModule],
  controllers: [MessagesController],
})
export class MessagesModule {}
