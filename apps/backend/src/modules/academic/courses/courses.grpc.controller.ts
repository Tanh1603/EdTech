import { Metadata } from '@grpc/grpc-js';
import { Controller, UseGuards } from '@nestjs/common';
import {
  GrpcContractMethod,
  GrpcMethods,
  GrpcServices,
  toGrpcPage,
  toIsoString,
} from '@edtech/contracts';
import { GrpcUserAuthGuard } from '../../../common/guards/grpc-user-auth.guard';
import { getGrpcIdentity } from '../../../common/grpc/metadata.mapper';
import { runGrpc } from '../../../common/grpc/error-to-rpc-exception';
import { CoursesService } from './courses.service';

@Controller()
@UseGuards(GrpcUserAuthGuard)
export class CoursesGrpcController {
  constructor(private readonly coursesService: CoursesService) {}

  @GrpcContractMethod(GrpcServices.academicCourses, GrpcMethods.academicCourses.getCourses)
  getCourses(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      const page = await this.coursesService.getCourses(
        {
          page: payload.page || undefined,
          limit: payload.limit || undefined,
          search: payload.search || undefined,
          teacherId: payload.teacherId || undefined,
        },
        identity.userId,
        identity.roles,
      );
      return toGrpcPage(page as any, this.toCourse);
    });
  }

  @GrpcContractMethod(GrpcServices.academicCourses, GrpcMethods.academicCourses.createCourse)
  createCourse(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return this.toCourse(
        await this.coursesService.createCourse(
          {
            teacherId: payload.teacherId,
            name: payload.name,
            description: payload.description || undefined,
            thumbnailUrl: payload.thumbnailUrl || undefined,
          },
          identity.userId,
          identity.roles,
        ),
      );
    });
  }

  @GrpcContractMethod(GrpcServices.academicCourses, GrpcMethods.academicCourses.getCourseDetail)
  getCourseDetail(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return this.toCourseDetail(
        await this.coursesService.getCourseDetail(
          payload.courseId,
          identity.userId,
          identity.roles,
        ),
      );
    });
  }

  @GrpcContractMethod(GrpcServices.academicCourses, GrpcMethods.academicCourses.updateCourse)
  updateCourse(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return this.toCourse(
        await this.coursesService.updateCourse(
          payload.courseId,
          {
            name: payload.name,
            description: payload.description,
            thumbnailUrl: payload.thumbnailUrl,
          },
          identity.userId,
          identity.roles,
        ),
      );
    });
  }

  @GrpcContractMethod(GrpcServices.academicCourses, GrpcMethods.academicCourses.deleteCourse)
  deleteCourse(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return this.coursesService.deleteCourse(
        payload.courseId,
        identity.userId,
        identity.roles,
      );
    });
  }

  private toCourse = (course: any) => ({
    id: course.id,
    teacherId: course.teacherId,
    name: course.name,
    description: course.description ?? '',
    thumbnailUrl: course.thumbnailUrl ?? '',
    createdAt: toIsoString(course.createdAt),
    updatedAt: toIsoString(course.updatedAt),
  });

  private toCourseDetail = (course: any) => ({
    ...this.toCourse(course),
    classrooms: (course.classrooms ?? []).map((classroom: any) => ({
      id: classroom.id,
      courseId: classroom.courseId,
      name: classroom.name,
      inviteCode: classroom.inviteCode,
      startAt: toIsoString(classroom.startAt),
      endAt: toIsoString(classroom.endAt),
      createdAt: toIsoString(classroom.createdAt),
    })),
    lessons: (course.lessons ?? []).map((lesson: any) => ({
      id: lesson.id,
      courseId: lesson.courseId,
      title: lesson.title,
      description: lesson.description ?? '',
      orderNo: lesson.orderNo,
      createdAt: toIsoString(lesson.createdAt),
      updatedAt: toIsoString(lesson.updatedAt),
    })),
  });
}
