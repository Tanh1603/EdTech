import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { RoadmapsGrpcController } from './roadmaps.grpc.controller';
import { RoadmapsService } from './roadmaps.service';

@Module({
  imports: [PrismaModule],
  controllers: [RoadmapsGrpcController],
  providers: [RoadmapsService],
})
export class RoadmapsModule {}
