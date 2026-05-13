import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { MasteryGrpcController } from './mastery.grpc.controller';
import { MasteryService } from './mastery.service';

@Module({
  imports: [PrismaModule],
  controllers: [MasteryGrpcController],
  providers: [MasteryService],
})
export class MasteryModule {}
