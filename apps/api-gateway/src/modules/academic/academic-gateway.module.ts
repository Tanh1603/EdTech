import { Module } from '@nestjs/common';
import { GrpcClientsModule } from '../grpc-clients/grpc-clients.module';
import { ClassroomsGatewayController } from './classrooms.gateway.controller';
import { CoursesGatewayController } from './courses.gateway.controller';
import { EnrollmentsGatewayController } from './enrollments.gateway.controller';
import { LessonsGatewayController } from './lessons.gateway.controller';

@Module({
  imports: [GrpcClientsModule],
  controllers: [
    CoursesGatewayController,
    ClassroomsGatewayController,
    LessonsGatewayController,
    EnrollmentsGatewayController,
  ],
})
export class AcademicGatewayModule {}
