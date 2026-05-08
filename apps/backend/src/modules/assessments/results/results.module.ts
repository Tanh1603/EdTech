import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { AssessmentsSharedService } from '../shared/assessments-shared.service';
import { ResultsController } from './results.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ResultsController],
  providers: [AssessmentsSharedService],
})
export class ResultsModule {}
