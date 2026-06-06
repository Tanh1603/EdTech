import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { JobsModule } from '../../jobs/jobs.module';
import { RoadmapsGrpcController } from './roadmaps.grpc.controller';
import { RoadmapsService } from './roadmaps.service';

@Module({
  imports: [PrismaModule, JobsModule],
  controllers: [RoadmapsGrpcController],
  providers: [RoadmapsService],
})
export class RoadmapsModule {}
