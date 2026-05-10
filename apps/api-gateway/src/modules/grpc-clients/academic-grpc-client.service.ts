import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { GrpcServices } from '@edtech/contracts';
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
      GrpcServices.academicCourses,
    );
    this.classrooms = this.client.getService<AcademicClassroomsGrpc>(
      GrpcServices.academicClassrooms,
    );
    this.lessons = this.client.getService<AcademicLessonsGrpc>(
      GrpcServices.academicLessons,
    );
    this.enrollments = this.client.getService<AcademicEnrollmentsGrpc>(
      GrpcServices.academicEnrollments,
    );
  }
}
