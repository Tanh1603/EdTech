import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { JobsModule } from '../../jobs/jobs.module';
import { ChatSharedService } from './chat-shared.service';
import { ChatGrpcController } from './chat.grpc.controller';

@Module({
  imports: [PrismaModule, JobsModule],
  controllers: [ChatGrpcController],
  providers: [ChatSharedService],
  exports: [ChatSharedService],
})
export class ChatSharedModule {}
