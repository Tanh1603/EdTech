import { Controller, UseGuards } from '@nestjs/common';
import {
  GrpcContractMethod,
  GrpcMethods,
  GrpcServices,
  RolePermissions,
  toListResponse,
  toObjectResponse,
  toPageResponse,
} from '@edtech/contracts';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { GrpcUserAuthGuard } from '../../../common/guards/grpc-user-auth.guard';
import { LessonsService } from './lessons.service';

@Controller()
@UseGuards(GrpcUserAuthGuard)
export class LessonsGrpcController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Permissions(RolePermissions.lessonsManage)
  @GrpcContractMethod(
    GrpcServices.academicLessons,
    GrpcMethods.academicLessons.createLesson,
  )
  createLesson(payload: any) {
    return this.lessonsService
      .createLesson({
        courseId: payload.courseId,
        title: payload.title,
        description: payload.description || undefined,
        orderNo: payload.orderNo,
      })
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.academicLessons,
    GrpcMethods.academicLessons.getLessonsByCourse,
  )
  @Permissions(RolePermissions.learningRead, RolePermissions.lessonsManage)
  async getLessonsByCourse(payload: any) {
    const page = await this.lessonsService.getLessonsByCourse(
      payload.courseId,
      {
        page: payload.page || undefined,
        limit: payload.limit || undefined,
      },
    );
    return toPageResponse(page as any);
  }

  @GrpcContractMethod(
    GrpcServices.academicLessons,
    GrpcMethods.academicLessons.getLessonDetail,
  )
  @Permissions(RolePermissions.learningRead, RolePermissions.lessonsManage)
  getLessonDetail(payload: any) {
    return this.lessonsService
      .getLessonDetail(payload.lessonId)
      .then(toObjectResponse);
  }

  @Permissions(RolePermissions.lessonsManage)
  @GrpcContractMethod(
    GrpcServices.academicLessons,
    GrpcMethods.academicLessons.updateLesson,
  )
  updateLesson(payload: any) {
    return this.lessonsService
      .updateLesson(payload.lessonId, {
        title: payload.title,
        description: payload.description,
        orderNo: payload.orderNo,
      })
      .then(toObjectResponse);
  }

  @Permissions(RolePermissions.lessonsManage)
  @GrpcContractMethod(
    GrpcServices.academicLessons,
    GrpcMethods.academicLessons.deleteLesson,
  )
  deleteLesson(payload: any) {
    return this.lessonsService.deleteLesson(payload.lessonId);
  }

  @Permissions(RolePermissions.lessonsManage)
  @GrpcContractMethod(
    GrpcServices.academicLessons,
    GrpcMethods.academicLessons.publishLessonToClassroom,
  )
  publishLessonToClassroom(payload: any) {
    return this.lessonsService
      .publishLessonToClassroom(payload.classroomId, {
        lessonId: payload.lessonId,
        isPublished: payload.isPublished,
      })
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.academicLessons,
    GrpcMethods.academicLessons.getClassroomLessons,
  )
  @Permissions(RolePermissions.learningRead, RolePermissions.lessonsManage)
  getClassroomLessons(payload: any) {
    return this.lessonsService
      .getClassroomLessons(payload.classroomId, {
        publishedOnly: payload.publishedOnly,
      })
      .then(toListResponse);
  }

  @Permissions(RolePermissions.lessonsManage)
  @GrpcContractMethod(
    GrpcServices.academicLessons,
    GrpcMethods.academicLessons.updateClassroomLesson,
  )
  updateClassroomLesson(payload: any) {
    return this.lessonsService
      .updateClassroomLesson(payload.classroomId, payload.lessonId, {
        isPublished: payload.isPublished,
      })
      .then(toObjectResponse);
  }

  @Permissions(RolePermissions.lessonsManage)
  @GrpcContractMethod(
    GrpcServices.academicLessons,
    GrpcMethods.academicLessons.removeLessonFromClassroom,
  )
  removeLessonFromClassroom(payload: any) {
    return this.lessonsService
      .removeLessonFromClassroom(payload.classroomId, payload.lessonId)
      .then(toObjectResponse);
  }
}
