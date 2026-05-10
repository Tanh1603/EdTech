import { HttpStatus, Injectable } from '@nestjs/common';
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
        { resourceType: 'classroom', resourceId: classroom.id },
      );
    }

    return enrollment;
  }

  async createEnrollment(payload: CreateEnrollmentDto) {
    const enrollment = await this.prisma.enrollment.create({ data: payload });
    const classroom = await this.prisma.classroom.findUnique({
      where: { id: payload.classId },
      select: { name: true },
    });
    await this.notificationsService.createForUser(
      payload.userId,
      'You were added to a class',
      `You were added to ${classroom?.name ?? 'a class'}.`,
      { resourceType: 'classroom', resourceId: payload.classId },
    );
    return enrollment;
  }

  async getClassroomStudents(classroomId: string) {
    await this.prisma.classroom.findUniqueOrThrow({ where: { id: classroomId } });

    return this.prisma.enrollment.findMany({
      where: { classId: classroomId },
      select: {
        id: true,
        userId: true,
        role: true,
        joinedAt: true,
      },
      orderBy: { joinedAt: 'desc' },
    });
  }

  async updateEnrollmentRole(
    enrollmentId: string,
    payload: UpdateEnrollmentDto,
  ) {
    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { role: payload.role },
    });
  }

  async removeEnrollment(enrollmentId: string) {
    const deleted = await this.prisma.enrollment.delete({
      where: { id: enrollmentId },
    });
    return { id: deleted.id, deleted: true };
  }
}
