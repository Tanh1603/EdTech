import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { ChatSharedService } from './chat-shared.service';
import { ChatGrpcController } from './chat.grpc.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ChatGrpcController],
  providers: [ChatSharedService],
  exports: [ChatSharedService],
})
export class ChatSharedModule {}
