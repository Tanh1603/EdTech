import { PrismaModule } from './../../../common/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { CoursesGrpcController } from './courses.grpc.controller';
import { CoursesService } from './courses.service';

@Module({
  imports: [PrismaModule],
  controllers: [CoursesGrpcController],
  providers: [CoursesService],
})
export class CoursesModule {}
