import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { RoadmapsController } from './roadmaps.controller';
import { RoadmapsService } from './roadmaps.service';

@Module({
  imports: [PrismaModule],
  controllers: [RoadmapsController],
  providers: [RoadmapsService],
})
export class RoadmapsModule {}
