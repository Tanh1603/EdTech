import { Injectable } from '@nestjs/common';
import { PageDto } from '../../../common/dto/page.dto';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { JobStatus, JobType } from '../../../generated/prisma/client';
import { ClassInvitesDto } from '../dto/class-invites.dto';
import { CreateClassDto } from '../dto/create-class.dto';
import { CreateCourseDto } from '../dto/create-course.dto';

@Injectable()
export class AcademicService {
  constructor(private readonly prisma: PrismaService) {}

  async getCourses(page: number, limit: number): Promise<PageDto<unknown>> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count(),
    ]);

    return this.toPage(items, page, limit, total);
  }

  async createCourse(payload: CreateCourseDto) {
    return this.prisma.course.create({ data: payload });
  }

  async getClasses(page: number, limit: number): Promise<PageDto<unknown>> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.classroom.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          course: {
            select: { teacherId: true },
          },
        },
      }),
      this.prisma.classroom.count(),
    ]);

    return this.toPage(
      items.map((classroom) => this.toClassroomResponse(classroom)),
      page,
      limit,
      total,
    );
  }

  async createClass(payload: CreateClassDto) {
    const classroom = await this.prisma.classroom.create({
      data: {
        name: payload.name,
        courseId: payload.courseId,
        inviteCode: payload.inviteCode ?? this.createInviteCode(),
      },
      include: {
        course: {
          select: { teacherId: true },
        },
      },
    });

    return this.toClassroomResponse(classroom);
  }

  async inviteClassMembers(classId: string, payload: ClassInvitesDto) {
    await this.prisma.classroom.findUniqueOrThrow({ where: { id: classId } });

    const job = await this.prisma.job.create({
      data: {
        type: JobType.notification_dispatch,
        status: JobStatus.queued,
        payload: { classId, emails: payload.emails },
      },
    });

    return { jobId: job.id, status: JobStatus.queued };
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
}
