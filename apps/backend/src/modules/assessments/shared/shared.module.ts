import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { AssessmentsSharedService } from './assessments-shared.service';

@Module({
  imports: [PrismaModule],
  providers: [AssessmentsSharedService],
  exports: [AssessmentsSharedService],
})
export class AssessmentsSharedModule {}
