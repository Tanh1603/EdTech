import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { JobsGrpcController } from './jobs.grpc.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [PrismaModule, QueueModule],
  controllers: [JobsGrpcController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
