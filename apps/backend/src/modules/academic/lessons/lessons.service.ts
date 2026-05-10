import { HttpStatus, Injectable } from '@nestjs/common';
import { PageDto } from '../../../common/dto/page.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { AppHttpException } from '../../../common/errors/app-http.exception';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { ClassroomLessonsQueryDto } from './dto/classroom-lessons-query.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { PublishClassroomLessonDto } from './dto/publish-classroom-lesson.dto';
import { UpdateClassroomLessonDto } from './dto/update-classroom-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  async createLesson(payload: CreateLessonDto) {
    return this.prisma.lesson.create({ data: payload });
  }

  async getLessonsByCourse(
    courseId: string,
    query: PaginationQueryDto,
  ): Promise<PageDto<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.LessonWhereInput = { courseId };

    const [items, total] = await Promise.all([
      this.prisma.lesson.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { orderNo: 'asc' },
      }),
      this.prisma.lesson.count({ where }),
    ]);

    return this.toPage(items, page, limit, total);
  }

  async getLessonDetail(lessonId: string) {
    return this.prisma.lesson.findUniqueOrThrow({
      where: { id: lessonId },
      include: {
        materials: true,
        classroomLessons: true,
      },
    });
  }

  async updateLesson(lessonId: string, payload: UpdateLessonDto) {
    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: payload,
    });
  }

  async deleteLesson(lessonId: string) {
    await this.prisma.$transaction([
      this.prisma.classroomLesson.deleteMany({ where: { lessonId } }),
      this.prisma.lesson.delete({ where: { id: lessonId } }),
    ]);

    return { id: lessonId, deleted: true };
  }

  async publishLessonToClassroom(
    classroomId: string,
    payload: PublishClassroomLessonDto,
  ) {
    const isPublished = payload.isPublished ?? true;

    await this.assertLessonBelongsToClassroomCourse(classroomId, payload.lessonId);

    const classroomLesson = await this.prisma.classroomLesson.create({
      data: {
        classId: classroomId,
        lessonId: payload.lessonId,
        isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
    });

    return this.toClassroomLessonResponse(classroomLesson);
  }

  async getClassroomLessons(
    classroomId: string,
    query: ClassroomLessonsQueryDto,
  ) {
    await this.prisma.classroom.findUniqueOrThrow({
      where: { id: classroomId },
      select: { id: true },
    });

    const classroomLessons = await this.prisma.classroomLesson.findMany({
      where: {
        classId: classroomId,
        ...(query.publishedOnly ? { isPublished: true } : {}),
      },
      include: {
        lesson: true,
      },
      orderBy: {
        lesson: { orderNo: 'asc' },
      },
    });

    return classroomLessons.map(({ lesson, ...classroomLesson }) => ({
      lessonId: lesson.id,
      title: lesson.title,
      description: lesson.description,
      orderNo: lesson.orderNo,
      isPublished: classroomLesson.isPublished,
      publishedAt: classroomLesson.publishedAt,
    }));
  }

  async updateClassroomLesson(
    classroomId: string,
    lessonId: string,
    payload: UpdateClassroomLessonDto,
  ) {
    const classroomLesson = await this.prisma.classroomLesson.update({
      where: { classId_lessonId: { classId: classroomId, lessonId } },
      data: {
        isPublished: payload.isPublished,
        publishedAt: payload.isPublished ? new Date() : null,
      },
    });

    return this.toClassroomLessonResponse(classroomLesson);
  }

  async removeLessonFromClassroom(classroomId: string, lessonId: string) {
    await this.prisma.classroomLesson.delete({
      where: { classId_lessonId: { classId: classroomId, lessonId } },
    });

    return { classroomId, lessonId, deleted: true };
  }

  private async assertLessonBelongsToClassroomCourse(
    classroomId: string,
    lessonId: string,
  ) {
    const classroom = await this.prisma.classroom.findUniqueOrThrow({
      where: { id: classroomId },
      select: { courseId: true },
    });

    const lesson = await this.prisma.lesson.findUniqueOrThrow({
      where: { id: lessonId },
      select: { courseId: true },
    });

    if (lesson.courseId !== classroom.courseId) {
      throw new AppHttpException(
        'VALIDATION_ERROR',
        'Lesson must belong to the same course as the classroom',
        HttpStatus.BAD_REQUEST,
      );
    }
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

  private toClassroomLessonResponse<T extends {
    classId: string;
    lessonId: string;
    isPublished: boolean;
    publishedAt: Date | null;
  }>(classroomLesson: T) {
    return {
      classroomId: classroomLesson.classId,
      lessonId: classroomLesson.lessonId,
      isPublished: classroomLesson.isPublished,
      publishedAt: classroomLesson.publishedAt,
    };
  }
}
