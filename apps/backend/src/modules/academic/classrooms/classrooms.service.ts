import { HttpStatus, Injectable } from '@nestjs/common';
import { PageDto, toIsoString, UserRole } from '@edtech/contracts';
import { AccessPolicyService } from '../../../common/access/access-policy.service';
import { AppHttpException } from '../../../common/errors/app-http.exception';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { toUserSummary, userSummarySelect } from '../../../common/rbac/rbac.mapper';
import { Prisma } from '../../../generated/prisma/client';
import { ClassInvitesDto } from '@edtech/contracts';
import { ClassroomQueryDto } from '@edtech/contracts';
import { CreateClassroomDto } from '@edtech/contracts';
import { UpdateClassroomDto } from '@edtech/contracts';
import { JobTypes } from '@edtech/contracts';
import { JobsService } from '../../jobs/jobs.service';

@Injectable()
export class ClassroomsService {
  constructor(
    private readonly accessPolicy: AccessPolicyService,
    private readonly prisma: PrismaService,
    private readonly jobsService: JobsService,
  ) {}

  async getClassrooms(
    query: ClassroomQueryDto,
    userId?: string,
    roles: UserRole[] = [],
  ): Promise<PageDto<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ClassroomWhereInput = {
      ...(query.courseId ? { courseId: query.courseId } : {}),
      ...(userId && !roles.includes(UserRole.admin)
        ? roles.includes(UserRole.teacher)
          ? { course: { teacherId: userId } }
          : { enrollments: { some: { userId } } }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.classroom.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          course: {
            select: {
              teacherId: true,
              teacher: { select: userSummarySelect },
            },
          },
        },
      }),
      this.prisma.classroom.count({ where }),
    ]);

    return this.toPage(
      items.map((classroom) => this.toClassroomResponse(classroom)),
      page,
      limit,
      total,
    );
  }

  async createClassroom(
    payload: CreateClassroomDto,
    userId?: string,
    roles: UserRole[] = [],
  ) {
    if (userId) {
      await this.accessPolicy.assertCourseTeacherOrAdmin(
        payload.courseId,
        userId,
        roles,
      );
    }

    this.assertDateRange(payload.startAt, payload.endAt);

    const classroom = await this.createClassroomWithUniqueInviteCode(payload);
    return this.toClassroomDetailResponse(classroom);
  }

  async getClassroomDetail(classroomId: string, userId?: string) {
    if (userId) {
      await this.accessPolicy.assertClassroomAccess(classroomId, userId);
    }

    const classroom = await this.prisma.classroom.findUniqueOrThrow({
      where: { id: classroomId },
      include: {
        course: {
          select: {
            teacherId: true,
            teacher: { select: userSummarySelect },
          },
        },
        enrollments: {
          include: {
            user: { select: userSummarySelect },
          },
        },
        classroomLessons: {
          include: {
            lesson: true,
          },
        },
      },
    });

    return this.toClassroomResponse(classroom);
  }

  async updateClassroom(
    classroomId: string,
    payload: UpdateClassroomDto,
    userId?: string,
    roles: UserRole[] = [],
  ) {
    if (userId) {
      await this.accessPolicy.assertClassTeacherOrAdmin(
        classroomId,
        userId,
        roles,
      );
    }

    this.assertDateRange(payload.startAt, payload.endAt);

    const classroom = await this.prisma.classroom.update({
      where: { id: classroomId },
      data: {
        ...payload,
        startAt: payload.startAt ? new Date(payload.startAt) : undefined,
        endAt: payload.endAt ? new Date(payload.endAt) : undefined,
      },
      include: {
        course: {
          select: {
            teacherId: true,
            teacher: { select: userSummarySelect },
          },
        },
      },
    });

    return this.toClassroomResponse(classroom);
  }

  async deleteClassroom(
    classroomId: string,
    userId?: string,
    roles: UserRole[] = [],
  ) {
    if (userId) {
      await this.accessPolicy.assertClassTeacherOrAdmin(
        classroomId,
        userId,
        roles,
      );
    }

    await this.prisma.$transaction([
      this.prisma.classroomLesson.deleteMany({ where: { classId: classroomId } }),
      this.prisma.enrollment.deleteMany({ where: { classId: classroomId } }),
      this.prisma.classroom.delete({ where: { id: classroomId } }),
    ]);

    return { id: classroomId, deleted: true };
  }

  async regenerateInviteCode(
    classroomId: string,
    userId?: string,
    roles: UserRole[] = [],
  ) {
    if (userId) {
      await this.accessPolicy.assertClassTeacherOrAdmin(
        classroomId,
        userId,
        roles,
      );
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const classroom = await this.prisma.classroom.update({
          where: { id: classroomId },
          data: { inviteCode: this.createInviteCode() },
          select: { inviteCode: true },
        });

        return { inviteCode: classroom.inviteCode };
      } catch (error) {
        if (!this.isUniqueConstraintError(error)) {
          throw error;
        }
      }
    }

    throw new AppHttpException(
      'DUPLICATE_RESOURCE',
      'Could not generate a unique invite code',
      HttpStatus.CONFLICT,
    );
  }

  async inviteClassMembers(
    classId: string,
    payload: ClassInvitesDto,
    userId?: string,
    roles: UserRole[] = [],
  ) {
    if (userId) {
      await this.accessPolicy.assertClassTeacherOrAdmin(classId, userId, roles);
    }

    await this.prisma.classroom.findUniqueOrThrow({ where: { id: classId } });

    const job = await this.jobsService.enqueue({
      type: JobTypes.notificationDispatch,
      payload: {
        title: 'Class invitation',
        body: 'You were invited to join a class.',
        emails: payload.emails,
        resourceType: 'classroom',
        resourceId: classId,
      },
      resourceType: 'classroom',
      resourceId: classId,
    });

    return {
      jobId: job.jobId,
      status: job.status,
      type: job.type,
      resourceId: job.resourceId,
    };
  }

  private async createClassroomWithUniqueInviteCode(
    payload: CreateClassroomDto,
  ) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await this.prisma.classroom.create({
          data: {
            name: payload.name,
            courseId: payload.courseId,
            inviteCode: payload.inviteCode ?? this.createInviteCode(),
            startAt: payload.startAt ? new Date(payload.startAt) : undefined,
            endAt: payload.endAt ? new Date(payload.endAt) : undefined,
          },
          include: {
            course: {
              select: {
                teacherId: true,
                teacher: { select: userSummarySelect },
              },
            },
          },
        });
      } catch (error) {
        if (!this.isUniqueConstraintError(error) || payload.inviteCode) {
          throw error;
        }
      }
    }

    throw new AppHttpException(
      'DUPLICATE_RESOURCE',
      'Could not generate a unique invite code',
      HttpStatus.CONFLICT,
    );
  }

  private assertDateRange(startAt?: string, endAt?: string): void {
    if (!startAt || !endAt) {
      return;
    }

    if (new Date(startAt).getTime() >= new Date(endAt).getTime()) {
      throw new AppHttpException(
        'VALIDATION_ERROR',
        'startAt must be before endAt',
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

  private toClassroomResponse(classroom: any) {
    return {
      id: classroom.id,
      courseId: classroom.courseId,
      teacherId: classroom.course?.teacherId ?? classroom.teacherId ?? '',
      teacher: toUserSummary(classroom.course?.teacher),
      name: classroom.name,
      inviteCode: classroom.inviteCode,
      startAt: toIsoString(classroom.startAt),
      endAt: toIsoString(classroom.endAt),
      createdAt: toIsoString(classroom.createdAt),
    };
  }

  private toClassroomDetailResponse(classroom: any) {
    return {
      ...this.toClassroomResponse(classroom),
      enrollments: (classroom.enrollments ?? []).map((enrollment: any) => ({
        id: enrollment.id,
        classId: enrollment.classId,
        userId: enrollment.userId,
        user: toUserSummary(enrollment.user),
        role: enrollment.role,
        joinedAt: toIsoString(enrollment.joinedAt),
      })),
      classroomLessons: (classroom.classroomLessons ?? []).map((item: any) => ({
        id: item.id,
        classId: item.classId,
        lessonId: item.lessonId,
        isPublished: item.isPublished,
        publishedAt: toIsoString(item.publishedAt),
        createdAt: toIsoString(item.createdAt),
      })),
    };
  }

  private createInviteCode(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from(
      { length: 8 },
      () => alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join('');
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
