import { Metadata } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { toIsoString } from '../../../common/grpc/date.mapper';
import { runGrpc } from '../../../common/grpc/error-to-rpc-exception';
import { assertServiceToken } from '../../../common/grpc/service-token';
import { EnrollmentsService } from './enrollments.service';

@Controller()
export class EnrollmentsGrpcController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @GrpcMethod('AcademicEnrollmentsService', 'JoinClassroom')
  joinClassroom(payload: any, metadata: Metadata) {
    assertServiceToken(metadata);
    return runGrpc(async () =>
      this.toEnrollment(
        await this.enrollmentsService.joinClassroom(
          { inviteCode: payload.inviteCode },
          payload.userId,
        ),
      ),
    );
  }

  @GrpcMethod('AcademicEnrollmentsService', 'CreateEnrollment')
  createEnrollment(payload: any, metadata: Metadata) {
    assertServiceToken(metadata);
    return runGrpc(async () =>
      this.toEnrollment(
        await this.enrollmentsService.createEnrollment({
          classId: payload.classId,
          userId: payload.userId,
          role: payload.role,
        }),
      ),
    );
  }

  @GrpcMethod('AcademicEnrollmentsService', 'GetClassroomStudents')
  getClassroomStudents(payload: any, metadata: Metadata) {
    assertServiceToken(metadata);
    return runGrpc(async () => ({
      items: (
        await this.enrollmentsService.getClassroomStudents(payload.classroomId)
      ).map(this.toStudentEnrollment),
    }));
  }

  @GrpcMethod('AcademicEnrollmentsService', 'UpdateEnrollmentRole')
  updateEnrollmentRole(payload: any, metadata: Metadata) {
    assertServiceToken(metadata);
    return runGrpc(async () =>
      this.toEnrollment(
        await this.enrollmentsService.updateEnrollmentRole(
          payload.enrollmentId,
          { role: payload.role },
        ),
      ),
    );
  }

  @GrpcMethod('AcademicEnrollmentsService', 'RemoveEnrollment')
  removeEnrollment(payload: any, metadata: Metadata) {
    assertServiceToken(metadata);
    return runGrpc(() =>
      this.enrollmentsService.removeEnrollment(payload.enrollmentId),
    );
  }

  private toEnrollment = (enrollment: any) => ({
    id: enrollment.id,
    classId: enrollment.classId,
    userId: enrollment.userId,
    role: enrollment.role,
    joinedAt: toIsoString(enrollment.joinedAt),
  });

  private toStudentEnrollment = (enrollment: any) => ({
    id: enrollment.id,
    userId: enrollment.userId,
    role: enrollment.role,
    joinedAt: toIsoString(enrollment.joinedAt),
  });
}
