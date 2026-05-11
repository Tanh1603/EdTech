import { Module } from '@nestjs/common';
import { AssessmentsSharedModule } from '../shared/shared.module';
import { ResultsController } from './results.controller';

@Module({
  imports: [AssessmentsSharedModule],
  controllers: [ResultsController],
})
export class ResultsModule {}
