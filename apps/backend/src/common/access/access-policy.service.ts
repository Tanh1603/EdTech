import { HttpStatus, Injectable } from '@nestjs/common';
import { AppHttpException } from '../errors/app-http.exception';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccessPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async assertClassroomAccess(classId: string, userId: string): Promise<void> {
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

  async assertChatSessionOwner(sessionId: string, userId: string): Promise<void> {
    await this.prisma.chatSession.findFirstOrThrow({
      where: { id: sessionId, userId },
      select: { id: true },
    });
  }

  async assertExamAccess(examId: string, userId: string): Promise<void> {
    const exam = await this.prisma.exam.findUniqueOrThrow({
      where: { id: examId },
      select: { classId: true, createdBy: true },
    });

    if (exam.createdBy === userId) {
      return;
    }

    await this.assertClassroomAccess(exam.classId, userId);
  }

  async assertSubmissionAccess(
    submissionId: string,
    userId: string,
  ): Promise<void> {
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

    await this.assertClassroomAccess(submission.exam.classId, userId);
  }

  async assertSubmissionOwner(
    submissionId: string,
    userId: string,
  ): Promise<void> {
    await this.prisma.submission.findFirstOrThrow({
      where: { id: submissionId, studentId: userId },
      select: { id: true },
    });
  }

  private throwForbidden(): never {
    throw new AppHttpException(
      'FORBIDDEN',
      'You do not have access to this resource.',
      HttpStatus.FORBIDDEN,
    );
  }
}
