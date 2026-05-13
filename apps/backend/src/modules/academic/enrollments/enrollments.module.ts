import { PrismaModule } from './../../../common/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { EnrollmentsGrpcController } from './enrollments.grpc.controller';
import { EnrollmentsService } from './enrollments.service';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [EnrollmentsGrpcController],
  providers: [EnrollmentsService],
})
export class EnrollmentsModule {}
