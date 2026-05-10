import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { MasteryController } from './mastery.controller';
import { MasteryGrpcController } from './mastery.grpc.controller';
import { MasteryService } from './mastery.service';

@Module({
  imports: [PrismaModule],
  controllers: [MasteryController, MasteryGrpcController],
  providers: [MasteryService],
})
export class MasteryModule {}
