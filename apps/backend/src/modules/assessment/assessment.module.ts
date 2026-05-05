import { Module } from '@nestjs/common';
import { AssessmentController } from './controllers/assessment.controller';
import { AssessmentService } from './services/assessment.service';

@Module({
  controllers: [AssessmentController],
  providers: [AssessmentService],
})
export class AssessmentModule {}

