import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { MasteryController } from './mastery.controller';
import { MasteryService } from './mastery.service';

@Module({
  imports: [PrismaModule],
  controllers: [MasteryController],
  providers: [MasteryService],
})
export class MasteryModule {}
