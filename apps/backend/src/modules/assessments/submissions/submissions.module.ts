import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { AssessmentsSharedService } from '../shared/assessments-shared.service';
import { SubmissionsController } from './submissions.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SubmissionsController],
  providers: [AssessmentsSharedService],
})
export class SubmissionsModule {}
