import { Injectable } from '@nestjs/common';
import { PageDto } from '../../../common/dto/page.dto';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CourseQueryDto } from './dto/course-query.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCourses(query: CourseQueryDto): Promise<PageDto<unknown>> {
    try {

      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const where: Prisma.CourseWhereInput = {
        ...(query.teacherId ? { teacherId: query.teacherId } : {}),
        ...(query.search
          ? { name: { contains: query.search, mode: 'insensitive' } }
          : {}),
      };

      const [items, total] = await this.prisma.$transaction([
        this.prisma.course.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.course.count({ where }),
      ]);

      return this.toPage(items, page, limit, total);
    } catch (error) {
console.log(error);

    }
  }

  async createCourse(payload: CreateCourseDto) {
    return this.prisma.course.create({ data: payload });
  }

  async getCourseDetail(courseId: string) {
    return this.prisma.course.findUniqueOrThrow({
      where: { id: courseId },
      include: {
        classrooms: true,
        lessons: { orderBy: { orderNo: 'asc' } },
      },
    });
  }

  async updateCourse(courseId: string, payload: UpdateCourseDto) {
    return this.prisma.course.update({
      where: { id: courseId },
      data: payload,
    });
  }

  async deleteCourse(courseId: string) {
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
