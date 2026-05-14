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
import { CoursesService } from './courses.service';

@Controller()
@UseGuards(GrpcUserAuthGuard)
export class CoursesGrpcController {
  constructor(private readonly coursesService: CoursesService) {}

  @GrpcContractMethod(
    GrpcServices.academicCourses,
    GrpcMethods.academicCourses.getCourses,
  )
  @Permissions(RolePermissions.learningRead, RolePermissions.coursesManage)
  async getCourses(payload: any, metadata: Metadata) {
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
  }

  @GrpcContractMethod(
    GrpcServices.academicCourses,
    GrpcMethods.academicCourses.createCourse,
  )
  @Permissions(RolePermissions.coursesManage)
  createCourse(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return Promise.resolve(
      this.coursesService.createCourse(
        {
          teacherId: payload.teacherId,
          name: payload.name,
          description: payload.description || undefined,
          thumbnailUrl: payload.thumbnailUrl || undefined,
        },
        identity.userId,
        identity.roles,
      ),
    ).then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.academicCourses,
    GrpcMethods.academicCourses.getCourseDetail,
  )
  @Permissions(RolePermissions.learningRead, RolePermissions.coursesManage)
  getCourseDetail(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return Promise.resolve(
      this.coursesService.getCourseDetail(
        payload.courseId,
        identity.userId,
        identity.roles,
      ),
    ).then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.academicCourses,
    GrpcMethods.academicCourses.updateCourse,
  )
  @Permissions(RolePermissions.coursesManage)
  updateCourse(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return Promise.resolve(
      this.coursesService.updateCourse(
        payload.courseId,
        {
          name: payload.name,
          description: payload.description,
          thumbnailUrl: payload.thumbnailUrl,
        },
        identity.userId,
        identity.roles,
      ),
    ).then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.academicCourses,
    GrpcMethods.academicCourses.deleteCourse,
  )
  @Permissions(RolePermissions.coursesManage)
  deleteCourse(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.coursesService.deleteCourse(
      payload.courseId,
      identity.userId,
      identity.roles,
    );
  }
}
