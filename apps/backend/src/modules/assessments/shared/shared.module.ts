import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { JobsModule } from '../../jobs/jobs.module';
import { NotificationsModule } from '../../notifications/notifications.module';
import { AssessmentsSharedService } from './assessments-shared.service';
import { AssessmentsGrpcController } from './assessments.grpc.controller';

@Module({
  imports: [PrismaModule, JobsModule, NotificationsModule],
  controllers: [AssessmentsGrpcController],
  providers: [AssessmentsSharedService],
  exports: [AssessmentsSharedService],
})
export class AssessmentsSharedModule {}
