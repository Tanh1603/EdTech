import { Injectable } from '@nestjs/common';
import { PageDto } from '@edtech/contracts';
import { AccessPolicyService } from '../../../common/access/access-policy.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ExamStatus,
  Prisma,
  QuestionType,
  SubmissionStatus,
} from '../../../generated/prisma/client';
import { CreateExamDto, UpdateExamDto } from '@edtech/contracts';
import { ExamsQueryDto } from '@edtech/contracts';
import { CreateQuestionDto, ReorderQuestionsDto, UpdateQuestionDto } from '@edtech/contracts';
import { AnswersDto, ManualGradeDto } from '@edtech/contracts';
import { JobTypes } from '@edtech/contracts';
import { JobsService } from '../../jobs/jobs.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class AssessmentsSharedService {
  constructor(
    private readonly accessPolicy: AccessPolicyService,
    private readonly prisma: PrismaService,
    private readonly jobsService: JobsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createExam(payload: CreateExamDto, userId: string) {
    await this.accessPolicy.assertClassroomAccess(payload.classId, userId);

    return this.prisma.exam.create({
      data: { ...payload, createdBy: userId },
      select: { id: true, title: true, status: true },
    });
  }

  async getExams(query: ExamsQueryDto, userId: string): Promise<PageDto<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const status = this.toExamStatus(query.status);
    if (query.classId) {
      await this.accessPolicy.assertClassroomAccess(query.classId, userId);
    }

    const where: Prisma.ExamWhereInput = {
      ...(query.classId
        ? { classId: query.classId }
        : {
            OR: [
              { createdBy: userId },
              {
                classroom: {
                  OR: [
                    { course: { teacherId: userId } },
                    { enrollments: { some: { userId } } },
                  ],
                },
              },
            ],
          }),
      ...(status ? { status } : {}),
      ...(query.search ? { title: { contains: query.search, mode: 'insensitive' } } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.exam.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.exam.count({ where }),
    ]);
    return this.toPage(items, page, limit, total);
  }

  async getExamDetail(examId: string, userId: string) {
    await this.accessPolicy.assertExamAccess(examId, userId);

    const exam = await this.prisma.exam.findUniqueOrThrow({
      where: { id: examId },
      include: { _count: { select: { questions: true } } },
    });
    const { _count, ...rest } = exam;
    return { ...rest, questionsCount: _count.questions };
  }

  async updateExam(examId: string, payload: UpdateExamDto, userId: string) {
    await this.accessPolicy.assertExamAccess(examId, userId);

    return this.prisma.exam.update({ where: { id: examId }, data: payload });
  }

  async deleteExam(examId: string, userId: string) {
    await this.accessPolicy.assertExamAccess(examId, userId);

    await this.prisma.$transaction([
      this.prisma.result.deleteMany({ where: { submission: { examId } } }),
      this.prisma.submission.deleteMany({ where: { examId } }),
      this.prisma.question.deleteMany({ where: { examId } }),
      this.prisma.exam.delete({ where: { id: examId } }),
    ]);
    return { id: examId, deleted: true };
  }

  async publishExam(examId: string, userId: string) {
    await this.accessPolicy.assertExamAccess(examId, userId);

    const exam = await this.prisma.exam.update({
      where: { id: examId },
      data: { status: ExamStatus.published },
      select: { id: true, status: true, title: true, classId: true },
    });
    await this.notificationsService.createForClass(
      exam.classId,
      'New exam published',
      `${exam.title} is now available.`,
      { resourceType: 'exam', resourceId: exam.id },
    );
    return { examId: exam.id, status: exam.status };
  }

  async closeExam(examId: string, userId: string) {
    await this.accessPolicy.assertExamAccess(examId, userId);

    const exam = await this.prisma.exam.update({
      where: { id: examId },
      data: { status: ExamStatus.archived },
      select: { id: true, title: true, createdBy: true },
    });
    await this.notificationsService.createForUser(
      exam.createdBy,
      'Exam closed',
      `${exam.title} has been closed.`,
      { resourceType: 'exam', resourceId: exam.id },
    );
    return { examId: exam.id, status: 'closed' };
  }

  async createQuestion(examId: string, payload: CreateQuestionDto, userId: string) {
    await this.accessPolicy.assertExamAccess(examId, userId);

    return this.prisma.question.create({
      data: {
        examId,
        type: this.toQuestionType(payload.type),
        prompt: payload.prompt,
        options: payload.options as Prisma.InputJsonValue,
        answerKey: payload.answerKey as Prisma.InputJsonValue,
        explanation: payload.explanation,
        points: payload.points,
        orderNo: payload.orderNo,
      },
    });
  }

  async getExamQuestions(examId: string, userId: string) {
    await this.accessPolicy.assertExamAccess(examId, userId);

    return this.prisma.question.findMany({ where: { examId }, orderBy: { orderNo: 'asc' } });
  }

  async getQuestionDetail(questionId: string, userId: string) {
    await this.assertQuestionExamAccess(questionId, userId);

    return this.prisma.question.findUniqueOrThrow({ where: { id: questionId } });
  }

  async updateQuestion(questionId: string, payload: UpdateQuestionDto, userId: string) {
    await this.assertQuestionExamAccess(questionId, userId);

    return this.prisma.question.update({
      where: { id: questionId },
      data: {
        prompt: payload.prompt,
        points: payload.points,
        options: payload.options as Prisma.InputJsonValue,
        answerKey: payload.answerKey as Prisma.InputJsonValue,
        explanation: payload.explanation,
      },
    });
  }

  async deleteQuestion(questionId: string, userId: string) {
    await this.assertQuestionExamAccess(questionId, userId);

    await this.prisma.question.delete({ where: { id: questionId } });
    return { id: questionId, deleted: true };
  }

  async reorderQuestions(payload: ReorderQuestionsDto, userId: string) {
    const firstQuestionId = payload.items[0]?.questionId;
    if (firstQuestionId) {
      await this.assertQuestionExamAccess(firstQuestionId, userId);
    }

    const items = await this.prisma.$transaction(
      payload.items.map((item) =>
        this.prisma.question.update({
          where: { id: item.questionId },
          data: { orderNo: item.orderNo },
        }),
      ),
    );
    return { items };
  }

  async startExam(examId: string, userId: string) {
    await this.accessPolicy.assertExamAccess(examId, userId);

    const submission = await this.prisma.submission.upsert({
      where: { examId_studentId: { examId, studentId: userId } },
      create: { examId, studentId: userId },
      update: {},
    });
    return {
      submissionId: submission.id,
      status: submission.status,
      startAt: submission.startAt,
    };
  }

  async getSubmissionDetail(submissionId: string, userId: string) {
    await this.accessPolicy.assertSubmissionAccess(submissionId, userId);

    return this.prisma.submission.findUniqueOrThrow({
      where: { id: submissionId },
      include: { result: true, exam: true },
    });
  }

  async autosaveAnswers(submissionId: string, payload: AnswersDto, userId: string) {
    await this.accessPolicy.assertSubmissionOwner(submissionId, userId);

    return this.prisma.submission.update({
      where: { id: submissionId },
      data: { answers: payload.answers as Prisma.InputJsonValue },
    });
  }

  async submitSubmission(submissionId: string, userId: string) {
    await this.accessPolicy.assertSubmissionOwner(submissionId, userId);

    const submission = await this.prisma.submission.update({
      where: { id: submissionId },
      data: { status: SubmissionStatus.submitted, submittedAt: new Date() },
      select: { id: true, status: true, examId: true, studentId: true },
    });
    const gradingJob = await this.jobsService.enqueue({
      type: JobTypes.aiAssessmentGrade,
      payload: {
        submissionId: submission.id,
        examId: submission.examId,
        studentId: submission.studentId,
      },
      createdBy: submission.studentId,
      resourceType: 'submission',
      resourceId: submission.id,
    });

    const exam = await this.prisma.exam.findUnique({
      where: { id: submission.examId },
      select: { title: true, createdBy: true },
    });
    if (exam?.createdBy) {
      await this.notificationsService.createForUser(
        exam.createdBy,
        'New submission received',
        `A student submitted ${exam.title}.`,
        { resourceType: 'submission', resourceId: submission.id },
      );
    }

    return {
      submissionId: submission.id,
      status: submission.status,
      gradingJob: {
        jobId: gradingJob.jobId,
        status: gradingJob.status,
        type: gradingJob.type,
      },
    };
  }

  async getResult(submissionId: string, userId: string) {
    await this.accessPolicy.assertSubmissionAccess(submissionId, userId);

    return this.prisma.result.findUniqueOrThrow({ where: { submissionId } });
  }

  async manualGrade(submissionId: string, payload: ManualGradeDto, userId: string) {
    await this.accessPolicy.assertSubmissionAccess(submissionId, userId);

    const result = await this.prisma.result.upsert({
      where: { submissionId },
      create: {
        submissionId,
        score: payload.score,
        feedback: payload.feedback as Prisma.InputJsonValue,
        gradedByAi: false,
        gradedAt: new Date(),
      },
      update: {
        score: payload.score,
        feedback: payload.feedback as Prisma.InputJsonValue,
        gradedByAi: false,
        gradedAt: new Date(),
      },
    });
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      select: { studentId: true, exam: { select: { title: true } } },
    });
    if (submission?.studentId) {
      await this.notificationsService.createForUser(
        submission.studentId,
        'Assessment graded',
        `Your result for ${submission.exam.title} is ready.`,
        { resourceType: 'submission', resourceId: submissionId },
      );
    }
    return result;
  }

  async getExamAnalytics(examId: string, userId: string) {
    await this.accessPolicy.assertExamAccess(examId, userId);

    const aggregate = await this.prisma.result.aggregate({
      where: { submission: { examId } },
      _avg: { score: true },
      _max: { score: true },
      _min: { score: true },
      _count: { _all: true },
    });
    return {
      averageScore: aggregate._avg.score ?? 0,
      highestScore: aggregate._max.score ?? 0,
      lowestScore: aggregate._min.score ?? 0,
      submissionCount: aggregate._count._all,
    };
  }

  async getQuestionAnalytics(examId: string, userId: string) {
    await this.accessPolicy.assertExamAccess(examId, userId);

    const questions = await this.prisma.question.findMany({
      where: { examId },
      orderBy: { orderNo: 'asc' },
      select: { id: true },
    });
    return {
      questions: questions.map((question) => ({
        questionId: question.id,
        correctRate: 0,
      })),
    };
  }

  async getStudentAnalytics(studentId: string, userId: string) {
    if (studentId !== userId) {
      await this.prisma.enrollment.findFirstOrThrow({
        where: {
          userId: studentId,
          classroom: {
            OR: [
              { course: { teacherId: userId } },
              { enrollments: { some: { userId } } },
            ],
          },
        },
        select: { id: true },
      });
    }

    const aggregate = await this.prisma.result.aggregate({
      where: { submission: { studentId } },
      _avg: { score: true },
      _count: { _all: true },
    });
    return {
      averageScore: aggregate._avg.score ?? 0,
      completedExams: aggregate._count._all,
      weakTopics: [],
    };
  }

  private toExamStatus(status?: string): ExamStatus | undefined {
    if (!status) return undefined;
    if (status === 'closed') return ExamStatus.archived;
    if (status in ExamStatus) return status as ExamStatus;
    return undefined;
  }

  private async assertQuestionExamAccess(questionId: string, userId: string) {
    const question = await this.prisma.question.findUniqueOrThrow({
      where: { id: questionId },
      select: { examId: true },
    });
    await this.accessPolicy.assertExamAccess(question.examId, userId);
  }

  private toQuestionType(type: string): QuestionType {
    const aliases: Record<string, QuestionType> = {
      multiple_choice: QuestionType.mcq,
      single_choice: QuestionType.mcq,
      coding: QuestionType.essay,
    };
    if (type in QuestionType) return type as QuestionType;
    return aliases[type] ?? QuestionType.short_answer;
  }

  private toPage<T>(items: T[], page: number, limit: number, total: number): PageDto<T> {
    return {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
