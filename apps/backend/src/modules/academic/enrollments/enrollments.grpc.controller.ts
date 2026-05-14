import { Metadata } from '@grpc/grpc-js';
import { Controller, UseGuards } from '@nestjs/common';
import {
  GrpcContractMethod,
  GrpcMethods,
  GrpcServices,
  RolePermissions,
  toListResponse,
  toObjectResponse,
} from '@edtech/contracts';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { GrpcUserAuthGuard } from '../../../common/guards/grpc-user-auth.guard';
import { getGrpcIdentity } from '../../../common/grpc/metadata.mapper';
import { EnrollmentsService } from './enrollments.service';

@Controller()
@UseGuards(GrpcUserAuthGuard)
export class EnrollmentsGrpcController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @GrpcContractMethod(
    GrpcServices.academicEnrollments,
    GrpcMethods.academicEnrollments.joinClassroom,
  )
  @Permissions(RolePermissions.learningRead)
  joinClassroom(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return Promise.resolve(
      this.enrollmentsService.joinClassroom(
        { inviteCode: payload.inviteCode },
        identity.userId,
      ),
    ).then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.academicEnrollments,
    GrpcMethods.academicEnrollments.createEnrollment,
  )
  @Permissions(RolePermissions.enrollmentsManage)
  createEnrollment(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return Promise.resolve(
      this.enrollmentsService.createEnrollment(
        {
          classId: payload.classId,
          userId: payload.userId,
          role: payload.role,
        },
        identity.userId,
        identity.roles,
      ),
    ).then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.academicEnrollments,
    GrpcMethods.academicEnrollments.getClassroomStudents,
  )
  @Permissions(RolePermissions.enrollmentsManage)
  getClassroomStudents(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return Promise.resolve(
      this.enrollmentsService.getClassroomStudents(
        payload.classroomId,
        identity.userId,
        identity.roles,
      ),
    ).then(toListResponse);
  }

  @GrpcContractMethod(
    GrpcServices.academicEnrollments,
    GrpcMethods.academicEnrollments.updateEnrollmentRole,
  )
  @Permissions(RolePermissions.enrollmentsManage)
  updateEnrollmentRole(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return Promise.resolve(
      this.enrollmentsService.updateEnrollmentRole(
        payload.enrollmentId,
        { role: payload.role },
        identity.userId,
        identity.roles,
      ),
    ).then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.academicEnrollments,
    GrpcMethods.academicEnrollments.removeEnrollment,
  )
  @Permissions(RolePermissions.enrollmentsManage)
  removeEnrollment(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.enrollmentsService.removeEnrollment(
      payload.enrollmentId,
      identity.userId,
      identity.roles,
    );
  }
}
