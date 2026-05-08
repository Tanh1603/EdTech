import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { AssessmentsSharedService } from '../shared/assessments-shared.service';
import { QuestionsController } from './questions.controller';

@Module({
  imports: [PrismaModule],
  controllers: [QuestionsController],
  providers: [AssessmentsSharedService],
})
export class QuestionsModule {}
