import { Metadata } from '@grpc/grpc-js';
import { Controller, UseGuards } from '@nestjs/common';
import {
  GrpcContractMethod,
  GrpcMethods,
  GrpcServices,
  toObjectResponse,
  toPageResponse,
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
  async getCourses(payload: any, metadata: Metadata) {
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
      return toPageResponse(page as any);
    });
  }

  @GrpcContractMethod(GrpcServices.academicCourses, GrpcMethods.academicCourses.createCourse)
  createCourse(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return Promise.resolve(this.coursesService.createCourse(
          {
            teacherId: payload.teacherId,
            name: payload.name,
            description: payload.description || undefined,
            thumbnailUrl: payload.thumbnailUrl || undefined,
          },
          identity.userId,
          identity.roles,
      )).then(toObjectResponse);
    });
  }

  @GrpcContractMethod(GrpcServices.academicCourses, GrpcMethods.academicCourses.getCourseDetail)
  getCourseDetail(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return Promise.resolve(this.coursesService.getCourseDetail(
          payload.courseId,
          identity.userId,
          identity.roles,
      )).then(toObjectResponse);
    });
  }

  @GrpcContractMethod(GrpcServices.academicCourses, GrpcMethods.academicCourses.updateCourse)
  updateCourse(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return Promise.resolve(this.coursesService.updateCourse(
          payload.courseId,
          {
            name: payload.name,
            description: payload.description,
            thumbnailUrl: payload.thumbnailUrl,
          },
          identity.userId,
          identity.roles,
      )).then(toObjectResponse);
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

}
