import { Metadata } from '@grpc/grpc-js';
import { Controller, UseGuards } from '@nestjs/common';
import {
  GrpcContractMethod,
  GrpcMethods,
  GrpcServices,
  RolePermissions,
  toObjectResponse,
  toPageResponse,
} from '@edtech/contracts';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { GrpcUserAuthGuard } from '../../../common/guards/grpc-user-auth.guard';
import { getGrpcIdentity } from '../../../common/grpc/metadata.mapper';
import { ClassroomsService } from './classrooms.service';

@Controller()
@UseGuards(GrpcUserAuthGuard)
export class ClassroomsGrpcController {
  constructor(private readonly classroomsService: ClassroomsService) {}

  @GrpcContractMethod(
    GrpcServices.academicClassrooms,
    GrpcMethods.academicClassrooms.getClassrooms,
  )
  @Permissions(RolePermissions.learningRead, RolePermissions.classesManage)
  async getClassrooms(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    const page = await this.classroomsService.getClassrooms(
      {
        page: payload.page || undefined,
        limit: payload.limit || undefined,
        courseId: payload.courseId || undefined,
      },
      identity.userId,
      identity.roles,
    );
    return toPageResponse(page as any);
  }

  @GrpcContractMethod(
    GrpcServices.academicClassrooms,
    GrpcMethods.academicClassrooms.createClassroom,
  )
  @Permissions(RolePermissions.classesManage)
  createClassroom(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return Promise.resolve(
      this.classroomsService.createClassroom(
        {
          courseId: payload.courseId,
          name: payload.name,
          inviteCode: payload.inviteCode || undefined,
          startAt: payload.startAt || undefined,
          endAt: payload.endAt || undefined,
        },
        identity.userId,
        identity.roles,
      ),
    ).then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.academicClassrooms,
    GrpcMethods.academicClassrooms.getClassroomDetail,
  )
  @Permissions(RolePermissions.learningRead, RolePermissions.classesManage)
  getClassroomDetail(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return Promise.resolve(
      this.classroomsService.getClassroomDetail(
        payload.classroomId,
        identity.userId,
      ),
    ).then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.academicClassrooms,
    GrpcMethods.academicClassrooms.updateClassroom,
  )
  @Permissions(RolePermissions.classesManage)
  updateClassroom(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return Promise.resolve(
      this.classroomsService.updateClassroom(
        payload.classroomId,
        {
          name: payload.name,
          startAt: payload.startAt,
          endAt: payload.endAt,
        },
        identity.userId,
        identity.roles,
      ),
    ).then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.academicClassrooms,
    GrpcMethods.academicClassrooms.deleteClassroom,
  )
  @Permissions(RolePermissions.classesManage)
  deleteClassroom(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.classroomsService.deleteClassroom(
      payload.classroomId,
      identity.userId,
      identity.roles,
    );
  }

  @GrpcContractMethod(
    GrpcServices.academicClassrooms,
    GrpcMethods.academicClassrooms.regenerateInviteCode,
  )
  @Permissions(RolePermissions.classesManage)
  regenerateInviteCode(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return Promise.resolve(
      this.classroomsService.regenerateInviteCode(
        payload.classroomId,
        identity.userId,
        identity.roles,
      ),
    ).then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.academicClassrooms,
    GrpcMethods.academicClassrooms.inviteClassMembers,
  )
  @Permissions(RolePermissions.classesManage)
  inviteClassMembers(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return Promise.resolve(
      this.classroomsService.inviteClassMembers(
        payload.classId,
        { emails: payload.emails ?? [] },
        identity.userId,
        identity.roles,
      ),
    ).then(toObjectResponse);
  }
}
