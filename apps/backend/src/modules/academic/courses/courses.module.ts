import { PrismaModule } from './../../../common/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesGrpcController } from './courses.grpc.controller';
import { CoursesService } from './courses.service';

@Module({
  imports: [PrismaModule],
  controllers: [CoursesController, CoursesGrpcController],
  providers: [CoursesService],
})
export class CoursesModule {}
