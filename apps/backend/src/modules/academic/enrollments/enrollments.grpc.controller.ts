import { Metadata } from '@grpc/grpc-js';
import { Controller, UseGuards } from '@nestjs/common';
import {
  GrpcContractMethod,
  GrpcMethods,
  GrpcServices,
  toListResponse,
  toObjectResponse,
} from '@edtech/contracts';
import { GrpcUserAuthGuard } from '../../../common/guards/grpc-user-auth.guard';
import { getGrpcIdentity } from '../../../common/grpc/metadata.mapper';
import { runGrpc } from '../../../common/grpc/error-to-rpc-exception';
import { EnrollmentsService } from './enrollments.service';

@Controller()
@UseGuards(GrpcUserAuthGuard)
export class EnrollmentsGrpcController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @GrpcContractMethod(GrpcServices.academicEnrollments, GrpcMethods.academicEnrollments.joinClassroom)
  joinClassroom(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return Promise.resolve(this.enrollmentsService.joinClassroom(
          { inviteCode: payload.inviteCode },
          identity.userId,
      )).then(toObjectResponse);
    });
  }

  @GrpcContractMethod(GrpcServices.academicEnrollments, GrpcMethods.academicEnrollments.createEnrollment)
  createEnrollment(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return Promise.resolve(this.enrollmentsService.createEnrollment({
          classId: payload.classId,
          userId: payload.userId,
          role: payload.role,
        }, identity.userId, identity.roles)).then(toObjectResponse);
    });
  }

  @GrpcContractMethod(GrpcServices.academicEnrollments, GrpcMethods.academicEnrollments.getClassroomStudents)
  getClassroomStudents(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return Promise.resolve(
        this.enrollmentsService.getClassroomStudents(
            payload.classroomId,
            identity.userId,
            identity.roles,
        ),
      ).then(toListResponse);
    });
  }

  @GrpcContractMethod(GrpcServices.academicEnrollments, GrpcMethods.academicEnrollments.updateEnrollmentRole)
  updateEnrollmentRole(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return Promise.resolve(this.enrollmentsService.updateEnrollmentRole(
          payload.enrollmentId,
          { role: payload.role },
          identity.userId,
          identity.roles,
      )).then(toObjectResponse);
    });
  }

  @GrpcContractMethod(GrpcServices.academicEnrollments, GrpcMethods.academicEnrollments.removeEnrollment)
  removeEnrollment(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return this.enrollmentsService.removeEnrollment(
        payload.enrollmentId,
        identity.userId,
        identity.roles,
      );
    });
  }
}
