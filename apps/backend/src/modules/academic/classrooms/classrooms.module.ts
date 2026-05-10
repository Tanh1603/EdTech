import { PrismaModule } from './../../../common/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { ClassroomsController } from './classrooms.controller';
import { ClassroomsGrpcController } from './classrooms.grpc.controller';
import { ClassroomsService } from './classrooms.service';
import { JobsModule } from '../../jobs/jobs.module';

@Module({
  imports: [PrismaModule, JobsModule],
  controllers: [ClassroomsController, ClassroomsGrpcController],
  providers: [ClassroomsService],
})
export class ClassroomsModule {}
