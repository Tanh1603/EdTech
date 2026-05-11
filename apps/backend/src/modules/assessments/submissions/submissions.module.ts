import { Module } from '@nestjs/common';
import { AssessmentsSharedModule } from '../shared/shared.module';
import { SubmissionsController } from './submissions.controller';

@Module({
  imports: [AssessmentsSharedModule],
  controllers: [SubmissionsController],
})
export class SubmissionsModule {}
