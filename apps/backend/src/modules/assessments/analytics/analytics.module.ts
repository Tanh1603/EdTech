import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { AssessmentsSharedService } from '../shared/assessments-shared.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [AssessmentsSharedService],
})
export class AnalyticsModule {}
