import { PrismaModule } from './../../../common/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';

@Module({
  imports: [PrismaModule],
  controllers: [LessonsController],
  providers: [LessonsService],
})
export class LessonsModule {}
