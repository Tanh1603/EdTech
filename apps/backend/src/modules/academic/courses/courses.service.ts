import { Injectable } from '@nestjs/common';
import { PageDto, UserRole } from '@edtech/contracts';
import { AccessPolicyService } from '../../../common/access/access-policy.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
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
      }),
      this.prisma.course.count({ where }),
    ]);

    return this.toPage(items, page, limit, total);
  }

  async createCourse(
    payload: CreateCourseDto,
    userId: string,
    roles: UserRole[] = [],
  ) {
    this.accessPolicy.assertTeacher(roles);
    return this.prisma.course.create({
      data: {
        ...payload,
        teacherId: roles.includes(UserRole.admin) ? payload.teacherId : userId,
      },
    });
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

    return this.prisma.course.findUniqueOrThrow({
      where: { id: courseId },
      include: {
        classrooms: true,
        lessons: { orderBy: { orderNo: 'asc' } },
      },
    });
  }

  async updateCourse(
    courseId: string,
    payload: UpdateCourseDto,
    userId: string,
    roles: UserRole[] = [],
  ) {
    await this.accessPolicy.assertCourseTeacherOrAdmin(courseId, userId, roles);
    return this.prisma.course.update({
      where: { id: courseId },
      data: payload,
    });
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
}
