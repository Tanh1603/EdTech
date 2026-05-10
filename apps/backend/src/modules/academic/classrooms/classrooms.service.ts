import { HttpStatus, Injectable } from '@nestjs/common';
import { PageDto } from '@edtech/contracts';
import { AppHttpException } from '../../../common/errors/app-http.exception';
import { PrismaService } from '../../../common/prisma/prisma.service';
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
    private readonly prisma: PrismaService,
    private readonly jobsService: JobsService,
  ) {}

  async getClassrooms(query: ClassroomQueryDto): Promise<PageDto<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ClassroomWhereInput = {
      ...(query.courseId ? { courseId: query.courseId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.classroom.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          course: {
            select: { teacherId: true },
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

  async createClassroom(payload: CreateClassroomDto) {
    this.assertDateRange(payload.startAt, payload.endAt);

    const classroom = await this.createClassroomWithUniqueInviteCode(payload);
    return this.toClassroomResponse(classroom);
  }

  async getClassroomDetail(classroomId: string) {
    const classroom = await this.prisma.classroom.findUniqueOrThrow({
      where: { id: classroomId },
      include: {
        course: {
          select: { teacherId: true },
        },
        enrollments: true,
        classroomLessons: {
          include: {
            lesson: true,
          },
        },
      },
    });

    return this.toClassroomResponse(classroom);
  }

  async updateClassroom(classroomId: string, payload: UpdateClassroomDto) {
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
          select: { teacherId: true },
        },
      },
    });

    return this.toClassroomResponse(classroom);
  }

  async deleteClassroom(classroomId: string) {
    await this.prisma.$transaction([
      this.prisma.classroomLesson.deleteMany({ where: { classId: classroomId } }),
      this.prisma.enrollment.deleteMany({ where: { classId: classroomId } }),
      this.prisma.classroom.delete({ where: { id: classroomId } }),
    ]);

    return { id: classroomId, deleted: true };
  }

  async regenerateInviteCode(classroomId: string) {
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

  async inviteClassMembers(classId: string, payload: ClassInvitesDto) {
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
              select: { teacherId: true },
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

  private toClassroomResponse<T extends { course: { teacherId: string } }>(
    classroom: T,
  ) {
    const { course, ...rest } = classroom;
    return {
      ...rest,
      teacherId: course.teacherId,
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
