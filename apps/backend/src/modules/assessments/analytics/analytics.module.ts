import { Module } from '@nestjs/common';
import { AssessmentsSharedModule } from '../shared/shared.module';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [AssessmentsSharedModule],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
