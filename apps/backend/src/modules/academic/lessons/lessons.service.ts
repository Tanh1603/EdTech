import { HttpStatus, Injectable } from '@nestjs/common';
import { PageDto, toIsoString } from '@edtech/contracts';
import { PaginationQueryDto } from '@edtech/contracts';
import { AppHttpException } from '../../../common/errors/app-http.exception';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { toUserSummary, userSummarySelect } from '../../../common/rbac/rbac.mapper';
import { Prisma } from '../../../generated/prisma/client';
import { ClassroomLessonsQueryDto } from '@edtech/contracts';
import { CreateLessonDto } from '@edtech/contracts';
import { PublishClassroomLessonDto } from '@edtech/contracts';
import { UpdateClassroomLessonDto } from '@edtech/contracts';
import { UpdateLessonDto } from '@edtech/contracts';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class LessonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createLesson(payload: CreateLessonDto) {
    const lesson = await this.prisma.lesson.create({ data: payload });
    return this.toLessonResponse(lesson);
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

    return this.toPage(
      items.map((lesson) => this.toLessonResponse(lesson)),
      page,
      limit,
      total,
    );
  }

  async getLessonDetail(lessonId: string) {
    const lesson = await this.prisma.lesson.findUniqueOrThrow({
      where: { id: lessonId },
      include: {
        materials: {
          include: {
            creator: { select: userSummarySelect },
          },
        },
        classroomLessons: true,
      },
    });

    return this.toLessonDetailResponse(lesson);
  }

  async updateLesson(lessonId: string, payload: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: payload,
    });

    return this.toLessonResponse(lesson);
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

    if (isPublished) {
      await this.notifyLessonPublished(classroomId, payload.lessonId);
    }

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
      description: lesson.description ?? '',
      orderNo: lesson.orderNo,
      isPublished: classroomLesson.isPublished,
      publishedAt: toIsoString(classroomLesson.publishedAt),
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

    if (payload.isPublished) {
      await this.notifyLessonPublished(classroomId, lessonId);
    }

    return this.toClassroomLessonResponse(classroomLesson);
  }

  private async notifyLessonPublished(classroomId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { title: true },
    });
    await this.notificationsService.createForClass(
      classroomId,
      'New lesson published',
      `${lesson?.title ?? 'A lesson'} is now available.`,
    );
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
      publishedAt: toIsoString(classroomLesson.publishedAt),
    };
  }

  private toLessonResponse(lesson: {
    id: string;
    courseId: string;
    title: string;
    description: string | null;
    orderNo: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: lesson.id,
      courseId: lesson.courseId,
      title: lesson.title,
      description: lesson.description ?? '',
      orderNo: lesson.orderNo,
      createdAt: toIsoString(lesson.createdAt),
      updatedAt: toIsoString(lesson.updatedAt),
    };
  }

  private toLessonDetailResponse(lesson: Parameters<typeof this.toLessonResponse>[0] & {
    materials?: Array<{
      id: string;
      lessonId: string;
      title: string;
      storageUrl: string;
      publicId: string | null;
      mimeType: string | null;
      size: number | null;
      status: string;
      createdBy: string;
      createdAt: Date;
      creator?: Parameters<typeof toUserSummary>[0];
    }>;
    classroomLessons?: Array<{
      classId: string;
      lessonId: string;
      isPublished: boolean;
      publishedAt: Date | null;
    }>;
  }) {
    return {
      ...this.toLessonResponse(lesson),
      materials: (lesson.materials ?? []).map((material) => ({
        id: material.id,
        lessonId: material.lessonId,
        title: material.title,
        storageUrl: material.storageUrl,
        publicId: material.publicId ?? '',
        mimeType: material.mimeType ?? '',
        size: material.size ?? 0,
        status: material.status,
        createdBy: material.createdBy,
        creator: toUserSummary(material.creator),
        createdAt: toIsoString(material.createdAt),
      })),
      classroomLessons: (lesson.classroomLessons ?? []).map((item) => ({
        classroomId: item.classId,
        lessonId: item.lessonId,
        isPublished: item.isPublished,
        publishedAt: toIsoString(item.publishedAt),
      })),
    };
  }
}
