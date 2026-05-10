import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { JobsModule } from '../jobs/jobs.module';
import { QueueModule } from '../queue/queue.module';
import { NotificationDispatchWorker } from './notification-dispatch.worker';
import { NotificationsController } from './notifications.controller';
import { NotificationsGrpcController } from './notifications.grpc.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [PrismaModule, JobsModule, QueueModule],
  controllers: [NotificationsController, NotificationsGrpcController],
  providers: [NotificationsService, NotificationDispatchWorker],
  exports: [NotificationsService],
})
export class NotificationsModule {}

