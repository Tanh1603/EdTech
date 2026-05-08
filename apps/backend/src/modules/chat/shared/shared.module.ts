import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { ChatAnalyticsController } from './analytics.controller';
import { ChatSharedService } from './chat-shared.service';

@Module({
  imports: [PrismaModule],
  controllers: [ChatAnalyticsController],
  providers: [ChatSharedService],
  exports: [ChatSharedService],
})
export class ChatSharedModule {}
