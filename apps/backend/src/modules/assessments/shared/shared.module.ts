import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { AssessmentsSharedService } from './assessments-shared.service';
import { AssessmentsGrpcController } from './assessments.grpc.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AssessmentsGrpcController],
  providers: [AssessmentsSharedService],
  exports: [AssessmentsSharedService],
})
export class AssessmentsSharedModule {}
