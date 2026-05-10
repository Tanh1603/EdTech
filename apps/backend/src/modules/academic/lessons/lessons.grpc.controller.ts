import { Metadata } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { toIsoString } from '../../../common/grpc/date.mapper';
import { runGrpc } from '../../../common/grpc/error-to-rpc-exception';
import { toGrpcPage } from '../../../common/grpc/page.mapper';
import { assertServiceToken } from '../../../common/grpc/service-token';
import { LessonsService } from './lessons.service';

@Controller()
export class LessonsGrpcController {
  constructor(private readonly lessonsService: LessonsService) {}

  @GrpcMethod('AcademicLessonsService', 'CreateLesson')
  createLesson(payload: any, metadata: Metadata) {
    assertServiceToken(metadata);
    return runGrpc(async () =>
      this.toLesson(
        await this.lessonsService.createLesson({
          courseId: payload.courseId,
          title: payload.title,
          description: payload.description || undefined,
          orderNo: payload.orderNo,
        }),
      ),
    );
  }

  @GrpcMethod('AcademicLessonsService', 'GetLessonsByCourse')
  getLessonsByCourse(payload: any, metadata: Metadata) {
    assertServiceToken(metadata);
    return runGrpc(async () => {
      const page = await this.lessonsService.getLessonsByCourse(
        payload.courseId,
        {
          page: payload.page || undefined,
          limit: payload.limit || undefined,
        },
      );
      return toGrpcPage(page as any, this.toLesson);
    });
  }

  @GrpcMethod('AcademicLessonsService', 'GetLessonDetail')
  getLessonDetail(payload: any, metadata: Metadata) {
    assertServiceToken(metadata);
    return runGrpc(async () =>
      this.toLessonDetail(
        await this.lessonsService.getLessonDetail(payload.lessonId),
      ),
    );
  }

  @GrpcMethod('AcademicLessonsService', 'UpdateLesson')
  updateLesson(payload: any, metadata: Metadata) {
    assertServiceToken(metadata);
    return runGrpc(async () =>
      this.toLesson(
        await this.lessonsService.updateLesson(payload.lessonId, {
          title: payload.title,
          description: payload.description,
          orderNo: payload.orderNo,
        }),
      ),
    );
  }

  @GrpcMethod('AcademicLessonsService', 'DeleteLesson')
  deleteLesson(payload: any, metadata: Metadata) {
    assertServiceToken(metadata);
    return runGrpc(() => this.lessonsService.deleteLesson(payload.lessonId));
  }

  @GrpcMethod('AcademicLessonsService', 'PublishLessonToClassroom')
  publishLessonToClassroom(payload: any, metadata: Metadata) {
    assertServiceToken(metadata);
    return runGrpc(async () =>
      this.toClassroomLesson(
        await this.lessonsService.publishLessonToClassroom(payload.classroomId, {
          lessonId: payload.lessonId,
          isPublished: payload.isPublished,
        }),
      ),
    );
  }

  @GrpcMethod('AcademicLessonsService', 'GetClassroomLessons')
  getClassroomLessons(payload: any, metadata: Metadata) {
    assertServiceToken(metadata);
    return runGrpc(async () => ({
      items: (
        await this.lessonsService.getClassroomLessons(payload.classroomId, {
          publishedOnly: payload.publishedOnly,
        })
      ).map((item: any) => ({
        lessonId: item.lessonId,
        title: item.title,
        description: item.description ?? '',
        orderNo: item.orderNo,
        isPublished: item.isPublished,
        publishedAt: toIsoString(item.publishedAt),
      })),
    }));
  }

  @GrpcMethod('AcademicLessonsService', 'UpdateClassroomLesson')
  updateClassroomLesson(payload: any, metadata: Metadata) {
    assertServiceToken(metadata);
    return runGrpc(async () =>
      this.toClassroomLesson(
        await this.lessonsService.updateClassroomLesson(
          payload.classroomId,
          payload.lessonId,
          { isPublished: payload.isPublished },
        ),
      ),
    );
  }

  @GrpcMethod('AcademicLessonsService', 'RemoveLessonFromClassroom')
  removeLessonFromClassroom(payload: any, metadata: Metadata) {
    assertServiceToken(metadata);
    return runGrpc(() =>
      this.lessonsService.removeLessonFromClassroom(
        payload.classroomId,
        payload.lessonId,
      ),
    );
  }

  private toLesson = (lesson: any) => ({
    id: lesson.id,
    courseId: lesson.courseId,
    title: lesson.title,
    description: lesson.description ?? '',
    orderNo: lesson.orderNo,
    createdAt: toIsoString(lesson.createdAt),
    updatedAt: toIsoString(lesson.updatedAt),
  });

  private toLessonDetail = (lesson: any) => ({
    ...this.toLesson(lesson),
    materials: (lesson.materials ?? []).map((material: any) => ({
      id: material.id,
      lessonId: material.lessonId,
      title: material.title,
      storageUrl: material.storageUrl,
      publicId: material.publicId ?? '',
      mimeType: material.mimeType ?? '',
      size: material.size ?? 0,
      status: material.status,
      createdBy: material.createdBy,
      createdAt: toIsoString(material.createdAt),
    })),
    classroomLessons: (lesson.classroomLessons ?? []).map((item: any) => ({
      classroomId: item.classId,
      lessonId: item.lessonId,
      isPublished: item.isPublished,
      publishedAt: toIsoString(item.publishedAt),
    })),
  });

  private toClassroomLesson = (item: any) => ({
    classroomId: item.classroomId,
    lessonId: item.lessonId,
    isPublished: item.isPublished,
    publishedAt: toIsoString(item.publishedAt),
  });
}
