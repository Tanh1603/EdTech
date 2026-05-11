import { Module } from '@nestjs/common';
import { AssessmentsSharedModule } from '../shared/shared.module';
import { ExamsController } from './exams.controller';

@Module({
  imports: [AssessmentsSharedModule],
  controllers: [ExamsController],
})
export class ExamsModule {}
