import { HttpStatus, Injectable } from '@nestjs/common';
import { toIsoString, UserRole } from '@edtech/contracts';
import { AccessPolicyService } from '../../../common/access/access-policy.service';
import { AppHttpException } from '../../../common/errors/app-http.exception';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ClassRole } from '../../../generated/prisma/client';
import { CreateEnrollmentDto } from '@edtech/contracts';
import { JoinClassroomDto } from '@edtech/contracts';
import { UpdateEnrollmentDto } from '@edtech/contracts';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly accessPolicy: AccessPolicyService,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async joinClassroom(payload: JoinClassroomDto, userId: string) {
    const classroom = await this.prisma.classroom.findUnique({
      where: { inviteCode: payload.inviteCode },
      select: { id: true },
    });

    if (!classroom) {
      throw new AppHttpException(
        'RESOURCE_NOT_FOUND',
        'Classroom invite code not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const enrollment = await this.prisma.enrollment.create({
      data: {
        classId: classroom.id,
        userId,
        role: ClassRole.student,
      },
    });

    const detail = await this.prisma.classroom.findUnique({
      where: { id: classroom.id },
      select: { name: true, course: { select: { teacherId: true } } },
    });
    if (detail?.course.teacherId) {
      await this.notificationsService.createForUser(
        detail.course.teacherId,
        'New student joined your class',
        `A student joined ${detail.name}.`,
      );
    }

    return this.toEnrollmentResponse(enrollment);
  }

  async createEnrollment(
    payload: CreateEnrollmentDto,
    userId?: string,
    roles: UserRole[] = [],
  ) {
    if (userId) {
      await this.accessPolicy.assertClassTeacherOrAdmin(
        payload.classId,
        userId,
        roles,
      );
    }

    const enrollment = await this.prisma.enrollment.create({ data: payload });
    const classroom = await this.prisma.classroom.findUnique({
      where: { id: payload.classId },
      select: { name: true },
    });
    await this.notificationsService.createForUser(
      payload.userId,
      'You were added to a class',
      `You were added to ${classroom?.name ?? 'a class'}.`,
    );
    return this.toEnrollmentResponse(enrollment);
  }

  async getClassroomStudents(
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
    } else {
      await this.prisma.classroom.findUniqueOrThrow({ where: { id: classroomId } });
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { classId: classroomId },
      select: {
        id: true,
        userId: true,
        role: true,
        joinedAt: true,
      },
      orderBy: { joinedAt: 'desc' },
    });

    return enrollments.map((enrollment) =>
      this.toStudentEnrollmentResponse(enrollment),
    );
  }

  async updateEnrollmentRole(
    enrollmentId: string,
    payload: UpdateEnrollmentDto,
    userId?: string,
    roles: UserRole[] = [],
  ) {
    if (userId) {
      const enrollment = await this.prisma.enrollment.findUniqueOrThrow({
        where: { id: enrollmentId },
        select: { classId: true },
      });
      await this.accessPolicy.assertClassTeacherOrAdmin(
        enrollment.classId,
        userId,
        roles,
      );
    }

    const enrollment = await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { role: payload.role },
    });

    return this.toEnrollmentResponse(enrollment);
  }

  async removeEnrollment(
    enrollmentId: string,
    userId?: string,
    roles: UserRole[] = [],
  ) {
    if (userId) {
      const enrollment = await this.prisma.enrollment.findUniqueOrThrow({
        where: { id: enrollmentId },
        select: { classId: true },
      });
      await this.accessPolicy.assertClassTeacherOrAdmin(
        enrollment.classId,
        userId,
        roles,
      );
    }

    const deleted = await this.prisma.enrollment.delete({
      where: { id: enrollmentId },
    });
    return { id: deleted.id, deleted: true };
  }

  private toEnrollmentResponse(enrollment: {
    id: string;
    classId: string;
    userId: string;
    role: ClassRole;
    joinedAt: Date;
  }) {
    return {
      id: enrollment.id,
      classId: enrollment.classId,
      userId: enrollment.userId,
      role: enrollment.role,
      joinedAt: toIsoString(enrollment.joinedAt),
    };
  }

  private toStudentEnrollmentResponse(enrollment: {
    id: string;
    userId: string;
    role: ClassRole;
    joinedAt: Date;
  }) {
    return {
      id: enrollment.id,
      userId: enrollment.userId,
      role: enrollment.role,
      joinedAt: toIsoString(enrollment.joinedAt),
    };
  }
}
