import { Injectable } from '@nestjs/common';
import { PageDto, toIsoString, UserRole } from '@edtech/contracts';
import { AccessPolicyService } from '../../../common/access/access-policy.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { toUserSummary, userSummarySelect } from '../../../common/rbac/rbac.mapper';
import { Prisma } from '../../../generated/prisma/client';
import { CourseQueryDto } from '@edtech/contracts';
import { CreateCourseDto } from '@edtech/contracts';
import { UpdateCourseDto } from '@edtech/contracts';

@Injectable()
export class CoursesService {
  constructor(
    private readonly accessPolicy: AccessPolicyService,
    private readonly prisma: PrismaService,
  ) {}

  async getCourses(
    query: CourseQueryDto,
    userId: string,
    roles: UserRole[] = [],
  ): Promise<PageDto<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.CourseWhereInput = {
      ...(roles.includes(UserRole.admin)
        ? query.teacherId
          ? { teacherId: query.teacherId }
          : {}
        : roles.includes(UserRole.teacher)
          ? { teacherId: userId }
          : { classrooms: { some: { enrollments: { some: { userId } } } } }),
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { teacher: { select: userSummarySelect } },
      }),
      this.prisma.course.count({ where }),
    ]);

    return this.toPage(
      items.map((course) => this.toCourseResponse(course)),
      page,
      limit,
      total,
    );
  }

  async createCourse(
    payload: CreateCourseDto,
    userId: string,
    roles: UserRole[] = [],
  ) {
    this.accessPolicy.assertTeacher(roles);
    const course = await this.prisma.course.create({
      data: {
        ...payload,
        teacherId: roles.includes(UserRole.admin) ? payload.teacherId : userId,
      },
      include: { teacher: { select: userSummarySelect } },
    });

    return this.toCourseResponse(course);
  }

  async getCourseDetail(
    courseId: string,
    userId: string,
    roles: UserRole[] = [],
  ) {
    if (!roles.includes(UserRole.admin)) {
      const course = await this.prisma.course.findUniqueOrThrow({
        where: { id: courseId },
        select: {
          teacherId: true,
          classrooms: {
            where: { enrollments: { some: { userId } } },
            select: { id: true },
            take: 1,
          },
        },
      });
      if (course.teacherId !== userId && course.classrooms.length === 0) {
        await this.accessPolicy.assertCourseTeacherOrAdmin(courseId, userId, roles);
      }
    }

    const course = await this.prisma.course.findUniqueOrThrow({
      where: { id: courseId },
      include: {
        teacher: { select: userSummarySelect },
        classrooms: true,
        lessons: { orderBy: { orderNo: 'asc' } },
      },
    });

    return this.toCourseDetailResponse(course);
  }

  async updateCourse(
    courseId: string,
    payload: UpdateCourseDto,
    userId: string,
    roles: UserRole[] = [],
  ) {
    await this.accessPolicy.assertCourseTeacherOrAdmin(courseId, userId, roles);
    const course = await this.prisma.course.update({
      where: { id: courseId },
      data: payload,
      include: { teacher: { select: userSummarySelect } },
    });

    return this.toCourseResponse(course);
  }

  async deleteCourse(courseId: string, userId: string, roles: UserRole[] = []) {
    await this.accessPolicy.assertCourseTeacherOrAdmin(courseId, userId, roles);
    const deleted = await this.prisma.course.delete({ where: { id: courseId } });
    return { id: deleted.id, deleted: true };
  }

  private toPage<T>(
    items: T[],
    page: number,
    limit: number,
    total: number,
  ): PageDto<T> {
    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private toCourseResponse(course: {
    id: string;
    teacherId: string;
    name: string;
    description: string | null;
    thumbnailUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    teacher?: Parameters<typeof toUserSummary>[0];
  }) {
    return {
      id: course.id,
      teacherId: course.teacherId,
      name: course.name,
      description: course.description ?? '',
      thumbnailUrl: course.thumbnailUrl ?? '',
      teacher: toUserSummary(course.teacher),
      createdAt: toIsoString(course.createdAt),
      updatedAt: toIsoString(course.updatedAt),
    };
  }

  private toCourseDetailResponse(course: Parameters<typeof this.toCourseResponse>[0] & {
    classrooms?: Array<{
      id: string;
      courseId: string;
      name: string;
      inviteCode: string;
      startAt: Date;
      endAt: Date;
      createdAt: Date;
    }>;
    lessons?: Array<{
      id: string;
      courseId: string;
      title: string;
      description: string | null;
      orderNo: number;
      createdAt: Date;
      updatedAt: Date;
    }>;
  }) {
    return {
      ...this.toCourseResponse(course),
      classrooms: (course.classrooms ?? []).map((classroom) => ({
        id: classroom.id,
        courseId: classroom.courseId,
        name: classroom.name,
        inviteCode: classroom.inviteCode,
        startAt: toIsoString(classroom.startAt),
        endAt: toIsoString(classroom.endAt),
        createdAt: toIsoString(classroom.createdAt),
      })),
      lessons: (course.lessons ?? []).map((lesson) => ({
        id: lesson.id,
        courseId: lesson.courseId,
        title: lesson.title,
        description: lesson.description ?? '',
        orderNo: lesson.orderNo,
        createdAt: toIsoString(lesson.createdAt),
        updatedAt: toIsoString(lesson.updatedAt),
      })),
    };
  }
}
