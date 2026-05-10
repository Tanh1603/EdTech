import { Module } from '@nestjs/common';
import { AnalyticsModule } from './analytics/analytics.module';
import { ExamsModule } from './exams/exams.module';
import { QuestionsModule } from './questions/questions.module';
import { ResultsModule } from './results/results.module';
import { AssessmentsSharedModule } from './shared/shared.module';
import { SubmissionsModule } from './submissions/submissions.module';

@Module({
  imports: [
    ExamsModule,
    QuestionsModule,
    SubmissionsModule,
    ResultsModule,
    AnalyticsModule,
    AssessmentsSharedModule,
  ],
})
export class AssessmentsModule {}
