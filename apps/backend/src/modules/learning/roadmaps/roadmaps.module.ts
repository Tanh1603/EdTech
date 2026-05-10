import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { RoadmapsController } from './roadmaps.controller';
import { RoadmapsGrpcController } from './roadmaps.grpc.controller';
import { RoadmapsService } from './roadmaps.service';

@Module({
  imports: [PrismaModule],
  controllers: [RoadmapsController, RoadmapsGrpcController],
  providers: [RoadmapsService],
})
export class RoadmapsModule {}
