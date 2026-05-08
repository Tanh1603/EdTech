import { Module } from '@nestjs/common';
import { MessagesModule } from './messages/messages.module';
import { ChatSharedModule } from './shared/shared.module';
import { SessionsModule } from './sessions/sessions.module';

@Module({
  imports: [SessionsModule, MessagesModule, ChatSharedModule],
})
export class ChatModule {}
