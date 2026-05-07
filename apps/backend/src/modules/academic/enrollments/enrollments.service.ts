import { HttpStatus, Injectable } from '@nestjs/common';
import { AppHttpException } from '../../../common/errors/app-http.exception';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ClassRole } from '../../../generated/prisma/client';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { JoinClassroomDto } from './dto/join-classroom.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.enrollment.create({
      data: {
        classId: classroom.id,
        userId,
        role: ClassRole.student,
      },
    });
  }

  async createEnrollment(payload: CreateEnrollmentDto) {
    return this.prisma.enrollment.create({ data: payload });
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
