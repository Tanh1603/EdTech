import { Module } from '@nestjs/common';
import { AssessmentsSharedModule } from '../shared/shared.module';
import { QuestionsController } from './questions.controller';

@Module({
  imports: [AssessmentsSharedModule],
  controllers: [QuestionsController],
})
export class QuestionsModule {}
