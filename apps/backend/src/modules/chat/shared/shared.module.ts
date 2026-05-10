import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { ChatAnalyticsController } from './analytics.controller';
import { ChatSharedService } from './chat-shared.service';
import { ChatGrpcController } from './chat.grpc.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ChatAnalyticsController, ChatGrpcController],
  providers: [ChatSharedService],
  exports: [ChatSharedService],
})
export class ChatSharedModule {}
