import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { AssessmentsSharedService } from '../shared/assessments-shared.service';
import { ExamsController } from './exams.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ExamsController],
  providers: [AssessmentsSharedService],
})
export class ExamsModule {}
