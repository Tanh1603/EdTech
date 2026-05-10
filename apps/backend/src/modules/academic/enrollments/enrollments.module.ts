import { PrismaModule } from './../../../common/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsGrpcController } from './enrollments.grpc.controller';
import { EnrollmentsService } from './enrollments.service';

@Module({
  imports: [PrismaModule],
  controllers: [EnrollmentsController, EnrollmentsGrpcController],
  providers: [EnrollmentsService],
})
export class EnrollmentsModule {}
