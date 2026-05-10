import { Metadata } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcContractMethod, GrpcMethods, GrpcServices } from '@edtech/contracts';
import { toIsoString } from '@edtech/contracts';
import { runGrpc } from '../../../common/grpc/error-to-rpc-exception';
import { assertServiceToken } from '../../../common/grpc/service-token';
import { EnrollmentsService } from './enrollments.service';

@Controller()
export class EnrollmentsGrpcController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @GrpcContractMethod(GrpcServices.academicEnrollments, GrpcMethods.academicEnrollments.joinClassroom)
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

  @GrpcContractMethod(GrpcServices.academicEnrollments, GrpcMethods.academicEnrollments.createEnrollment)
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

  @GrpcContractMethod(GrpcServices.academicEnrollments, GrpcMethods.academicEnrollments.getClassroomStudents)
  getClassroomStudents(payload: any, metadata: Metadata) {
    assertServiceToken(metadata);
    return runGrpc(async () => ({
      items: (
        await this.enrollmentsService.getClassroomStudents(payload.classroomId)
      ).map(this.toStudentEnrollment),
    }));
  }

  @GrpcContractMethod(GrpcServices.academicEnrollments, GrpcMethods.academicEnrollments.updateEnrollmentRole)
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

  @GrpcContractMethod(GrpcServices.academicEnrollments, GrpcMethods.academicEnrollments.removeEnrollment)
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
