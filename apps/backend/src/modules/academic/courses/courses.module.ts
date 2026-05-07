import { PrismaModule } from './../../../common/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

@Module({
  imports: [PrismaModule],
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}
