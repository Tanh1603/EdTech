import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  AcademicClassroomsGrpc,
  AcademicCoursesGrpc,
  AcademicEnrollmentsGrpc,
  AcademicLessonsGrpc,
} from './academic-grpc.types';

export const ACADEMIC_GRPC_CLIENT = 'ACADEMIC_GRPC_CLIENT';

@Injectable()
export class AcademicGrpcClientService implements OnModuleInit {
  courses!: AcademicCoursesGrpc;
  classrooms!: AcademicClassroomsGrpc;
  lessons!: AcademicLessonsGrpc;
  enrollments!: AcademicEnrollmentsGrpc;

  constructor(@Inject(ACADEMIC_GRPC_CLIENT) private readonly client: ClientGrpc) {}

  onModuleInit(): void {
    this.courses = this.client.getService<AcademicCoursesGrpc>(
      'AcademicCoursesService',
    );
    this.classrooms = this.client.getService<AcademicClassroomsGrpc>(
      'AcademicClassroomsService',
    );
    this.lessons = this.client.getService<AcademicLessonsGrpc>(
      'AcademicLessonsService',
    );
    this.enrollments = this.client.getService<AcademicEnrollmentsGrpc>(
      'AcademicEnrollmentsService',
    );
  }
}
