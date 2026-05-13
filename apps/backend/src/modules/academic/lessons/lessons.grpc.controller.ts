import { Controller } from '@nestjs/common';
import {
  GrpcContractMethod,
  GrpcMethods,
  GrpcServices,
  toListResponse,
  toObjectResponse,
  toPageResponse,
} from '@edtech/contracts';
import { runGrpc } from '../../../common/grpc/error-to-rpc-exception';
import { LessonsService } from './lessons.service';

@Controller()
export class LessonsGrpcController {
  constructor(private readonly lessonsService: LessonsService) {}

  @GrpcContractMethod(GrpcServices.academicLessons, GrpcMethods.academicLessons.createLesson)
  createLesson(payload: any) {
    return runGrpc(async () =>
      this.lessonsService.createLesson({
          courseId: payload.courseId,
          title: payload.title,
          description: payload.description || undefined,
          orderNo: payload.orderNo,
        }).then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.academicLessons, GrpcMethods.academicLessons.getLessonsByCourse)
  getLessonsByCourse(payload: any) {
    return runGrpc(async () => {
      const page = await this.lessonsService.getLessonsByCourse(
        payload.courseId,
        {
          page: payload.page || undefined,
          limit: payload.limit || undefined,
        },
      );
      return toPageResponse(page as any);
    });
  }

  @GrpcContractMethod(GrpcServices.academicLessons, GrpcMethods.academicLessons.getLessonDetail)
  getLessonDetail(payload: any) {
    return runGrpc(async () =>
      this.lessonsService.getLessonDetail(payload.lessonId).then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.academicLessons, GrpcMethods.academicLessons.updateLesson)
  updateLesson(payload: any) {
    return runGrpc(async () =>
      this.lessonsService.updateLesson(payload.lessonId, {
          title: payload.title,
          description: payload.description,
          orderNo: payload.orderNo,
        }).then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.academicLessons, GrpcMethods.academicLessons.deleteLesson)
  deleteLesson(payload: any) {
    return runGrpc(() => this.lessonsService.deleteLesson(payload.lessonId));
  }

  @GrpcContractMethod(GrpcServices.academicLessons, GrpcMethods.academicLessons.publishLessonToClassroom)
  publishLessonToClassroom(payload: any) {
    return runGrpc(async () =>
      this.lessonsService.publishLessonToClassroom(payload.classroomId, {
          lessonId: payload.lessonId,
          isPublished: payload.isPublished,
        }).then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.academicLessons, GrpcMethods.academicLessons.getClassroomLessons)
  getClassroomLessons(payload: any) {
    return runGrpc(async () =>
      this.lessonsService.getClassroomLessons(payload.classroomId, {
          publishedOnly: payload.publishedOnly,
        }).then(toListResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.academicLessons, GrpcMethods.academicLessons.updateClassroomLesson)
  updateClassroomLesson(payload: any) {
    return runGrpc(async () =>
      this.lessonsService.updateClassroomLesson(
          payload.classroomId,
          payload.lessonId,
          { isPublished: payload.isPublished },
      ).then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.academicLessons, GrpcMethods.academicLessons.removeLessonFromClassroom)
  removeLessonFromClassroom(payload: any) {
    return runGrpc(() =>
      this.lessonsService.removeLessonFromClassroom(
        payload.classroomId,
        payload.lessonId,
      ).then(toObjectResponse),
    );
  }
}
