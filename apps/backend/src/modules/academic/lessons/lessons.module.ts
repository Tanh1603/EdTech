import { PrismaModule } from './../../../common/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsGrpcController } from './lessons.grpc.controller';
import { LessonsService } from './lessons.service';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [LessonsController, LessonsGrpcController],
  providers: [LessonsService],
})
export class LessonsModule {}
