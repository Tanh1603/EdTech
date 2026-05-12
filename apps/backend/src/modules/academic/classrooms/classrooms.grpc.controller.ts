import { Metadata } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcContractMethod, GrpcMethods, GrpcServices } from '@edtech/contracts';
import { toIsoString } from '@edtech/contracts';
import { getAuthenticatedGrpcUserId } from '../../../common/grpc/metadata.mapper';
import { runGrpc } from '../../../common/grpc/error-to-rpc-exception';
import { toGrpcPage } from '@edtech/contracts';
import { assertServiceToken } from '../../../common/grpc/service-token';
import { ClassroomsService } from './classrooms.service';

@Controller()
export class ClassroomsGrpcController {
  constructor(private readonly classroomsService: ClassroomsService) {}

  @GrpcContractMethod(GrpcServices.academicClassrooms, GrpcMethods.academicClassrooms.getClassrooms)
  getClassrooms(payload: any, metadata: Metadata) {
    assertServiceToken(metadata);
    return runGrpc(async () => {
      const page = await this.classroomsService.getClassrooms({
        page: payload.page || undefined,
        limit: payload.limit || undefined,
        courseId: payload.courseId || undefined,
      });
      return toGrpcPage(page as any, this.toClassroom);
    });
  }

  @GrpcContractMethod(GrpcServices.academicClassrooms, GrpcMethods.academicClassrooms.createClassroom)
  createClassroom(payload: any, metadata: Metadata) {
    assertServiceToken(metadata);
    return runGrpc(async () =>
      this.toClassroom(
        await this.classroomsService.createClassroom({
          courseId: payload.courseId,
          name: payload.name,
          inviteCode: payload.inviteCode || undefined,
          startAt: payload.startAt || undefined,
          endAt: payload.endAt || undefined,
        }),
      ),
    );
  }

  @GrpcContractMethod(GrpcServices.academicClassrooms, GrpcMethods.academicClassrooms.getClassroomDetail)
  getClassroomDetail(payload: any, metadata: Metadata) {
    assertServiceToken(metadata);
    return runGrpc(async () =>
      this.toClassroomDetail(
        await this.classroomsService.getClassroomDetail(
          payload.classroomId,
          await getAuthenticatedGrpcUserId(metadata),
        ),
      ),
    );
  }

  @GrpcContractMethod(GrpcServices.academicClassrooms, GrpcMethods.academicClassrooms.updateClassroom)
  updateClassroom(payload: any, metadata: Metadata) {
    assertServiceToken(metadata);
    return runGrpc(async () =>
      this.toClassroom(
        await this.classroomsService.updateClassroom(payload.classroomId, {
          name: payload.name,
          startAt: payload.startAt,
          endAt: payload.endAt,
        }),
      ),
    );
  }

  @GrpcContractMethod(GrpcServices.academicClassrooms, GrpcMethods.academicClassrooms.deleteClassroom)
  deleteClassroom(payload: any, metadata: Metadata) {
    assertServiceToken(metadata);
    return runGrpc(() =>
      this.classroomsService.deleteClassroom(payload.classroomId),
    );
  }

  @GrpcContractMethod(GrpcServices.academicClassrooms, GrpcMethods.academicClassrooms.regenerateInviteCode)
  regenerateInviteCode(payload: any, metadata: Metadata) {
    assertServiceToken(metadata);
    return runGrpc(() =>
      this.classroomsService.regenerateInviteCode(payload.classroomId),
    );
  }

  @GrpcContractMethod(GrpcServices.academicClassrooms, GrpcMethods.academicClassrooms.inviteClassMembers)
  inviteClassMembers(payload: any, metadata: Metadata) {
    assertServiceToken(metadata);
    return runGrpc(() =>
      this.classroomsService.inviteClassMembers(payload.classId, {
        emails: payload.emails ?? [],
      }),
    );
  }

  private toClassroom = (classroom: any) => ({
    id: classroom.id,
    courseId: classroom.courseId,
    teacherId: classroom.teacherId ?? '',
    name: classroom.name,
    inviteCode: classroom.inviteCode,
    startAt: toIsoString(classroom.startAt),
    endAt: toIsoString(classroom.endAt),
    createdAt: toIsoString(classroom.createdAt),
  });

  private toClassroomDetail = (classroom: any) => ({
    ...this.toClassroom(classroom),
    enrollments: (classroom.enrollments ?? []).map((enrollment: any) => ({
      id: enrollment.id,
      classId: enrollment.classId,
      userId: enrollment.userId,
      role: enrollment.role,
      joinedAt: toIsoString(enrollment.joinedAt),
    })),
    classroomLessons: (classroom.classroomLessons ?? []).map((item: any) => ({
      id: item.id,
      classId: item.classId,
      lessonId: item.lessonId,
      isPublished: item.isPublished,
      publishedAt: toIsoString(item.publishedAt),
      createdAt: toIsoString(item.createdAt),
    })),
  });
}
