import { HttpStatus, Injectable } from '@nestjs/common';
import { UserRole } from '@edtech/contracts';
import { AppHttpException } from '../errors/app-http.exception';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccessPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  assertAdmin(roles: UserRole[] = []): void {
    if (this.isAdmin(roles)) {
      return;
    }

    this.throwForbidden();
  }

  assertTeacher(roles: UserRole[] = []): void {
    if (this.isAdmin(roles) || roles.includes(UserRole.teacher)) {
      return;
    }

    this.throwForbidden();
  }

  assertStudent(roles: UserRole[] = []): void {
    if (this.isAdmin(roles) || roles.includes(UserRole.student)) {
      return;
    }

    this.throwForbidden();
  }

  async assertClassroomAccess(
    classId: string,
    userId: string,
    roles: UserRole[] = [],
  ): Promise<void> {
    if (this.isAdmin(roles)) {
      return;
    }

    const classroom = await this.prisma.classroom.findUniqueOrThrow({
      where: { id: classId },
      select: {
        course: { select: { teacherId: true } },
        enrollments: {
          where: { userId },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (
      classroom.course.teacherId === userId ||
      classroom.enrollments.length > 0
    ) {
      return;
    }

    this.throwForbidden();
  }

  async assertClassTeacherOrAdmin(
    classId: string,
    userId: string,
    roles: UserRole[] = [],
  ): Promise<void> {
    if (this.isAdmin(roles)) {
      return;
    }

    const classroom = await this.prisma.classroom.findUniqueOrThrow({
      where: { id: classId },
      select: {
        course: { select: { teacherId: true } },
        enrollments: {
          where: { userId, role: 'teacher' },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (
      classroom.course.teacherId === userId ||
      classroom.enrollments.length > 0
    ) {
      return;
    }

    this.throwForbidden();
  }

  async assertCourseTeacherOrAdmin(
    courseId: string,
    userId: string,
    roles: UserRole[] = [],
  ): Promise<void> {
    if (this.isAdmin(roles)) {
      return;
    }

    await this.prisma.course.findFirstOrThrow({
      where: { id: courseId, teacherId: userId },
      select: { id: true },
    });
  }

  async assertChatSessionOwner(
    sessionId: string,
    userId: string,
  ): Promise<void> {
    await this.prisma.chatSession.findFirstOrThrow({
      where: { id: sessionId, userId },
      select: { id: true },
    });
  }

  async assertExamAccess(
    examId: string,
    userId: string,
    roles: UserRole[] = [],
  ): Promise<void> {
    if (this.isAdmin(roles)) {
      return;
    }

    const exam = await this.prisma.exam.findUniqueOrThrow({
      where: { id: examId },
      select: { classId: true, createdBy: true },
    });

    if (exam.createdBy === userId) {
      return;
    }

    await this.assertClassroomAccess(exam.classId, userId, roles);
  }

  async assertExamManageAccess(
    examId: string,
    userId: string,
    roles: UserRole[] = [],
  ): Promise<void> {
    if (this.isAdmin(roles)) {
      return;
    }

    const exam = await this.prisma.exam.findUniqueOrThrow({
      where: { id: examId },
      select: { classId: true, createdBy: true },
    });

    if (exam.createdBy === userId) {
      return;
    }

    await this.assertClassTeacherOrAdmin(exam.classId, userId, roles);
  }

  async assertSubmissionAccess(
    submissionId: string,
    userId: string,
    roles: UserRole[] = [],
  ): Promise<void> {
    if (this.isAdmin(roles)) {
      return;
    }

    const submission = await this.prisma.submission.findUniqueOrThrow({
      where: { id: submissionId },
      select: {
        studentId: true,
        exam: { select: { classId: true, createdBy: true } },
      },
    });

    if (
      submission.studentId === userId ||
      submission.exam.createdBy === userId
    ) {
      return;
    }

    await this.assertClassroomAccess(submission.exam.classId, userId, roles);
  }

  async assertSubmissionOwnerTeacherOrAdmin(
    submissionId: string,
    userId: string,
    roles: UserRole[] = [],
  ): Promise<void> {
    if (this.isAdmin(roles)) {
      return;
    }

    const submission = await this.prisma.submission.findUniqueOrThrow({
      where: { id: submissionId },
      select: {
        studentId: true,
        exam: { select: { classId: true, createdBy: true } },
      },
    });

    if (
      submission.studentId === userId ||
      submission.exam.createdBy === userId
    ) {
      return;
    }

    await this.assertClassTeacherOrAdmin(
      submission.exam.classId,
      userId,
      roles,
    );
  }

  async assertSubmissionOwner(
    submissionId: string,
    userId: string,
    roles: UserRole[] = [],
  ): Promise<void> {
    if (this.isAdmin(roles)) {
      return;
    }

    await this.prisma.submission.findFirstOrThrow({
      where: { id: submissionId, studentId: userId },
      select: { id: true },
    });
  }

  private isAdmin(roles: UserRole[]): boolean {
    return roles.includes(UserRole.admin);
  }

  private throwForbidden(): never {
    throw new AppHttpException(
      'FORBIDDEN',
      'You do not have access to this resource.',
      HttpStatus.FORBIDDEN,
    );
  }
}
