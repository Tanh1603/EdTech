import { Injectable } from '@nestjs/common';
import { PageDto } from '@edtech/contracts';
import { AccessPolicyService } from '../../../common/access/access-policy.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { userSummarySelect } from '../../../common/rbac/rbac.mapper';
import {
  ExamStatus,
  Prisma,
  QuestionType,
  SubmissionStatus,
} from '../../../generated/prisma/client';
import { CreateExamDto, UpdateExamDto } from '@edtech/contracts';
import { UserRole } from '@edtech/contracts';
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

  async createExam(
    payload: CreateExamDto & { generateByAi?: boolean; topic?: string; difficulty?: string; numberOfQuestions?: number; questionTypes?: string[]; materialId?: string },
    userId: string,
    roles: UserRole[] = [],
  ) {
    await this.accessPolicy.assertClassTeacherOrAdmin(
      payload.classId,
      userId,
      roles,
    );

    const generateByAi = payload.generateByAi ?? false;

    const exam = await this.prisma.exam.create({
      data: {
        classId: payload.classId,
        title: payload.title,
        description: payload.description,
        duration: payload.duration,
        createdBy: userId,
        status: ExamStatus.draft,
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdBy: true,
        creator: { select: userSummarySelect },
      },
    });

    if (generateByAi) {
      const job = await this.jobsService.enqueue({
        type: JobTypes.aiExamGenerate,
        payload: {
          examId: exam.id,
          classId: payload.classId,
          topic: payload.topic,
          difficulty: payload.difficulty ?? 'medium',
          numberOfQuestions: payload.numberOfQuestions ?? 10,
          questionTypes: payload.questionTypes ?? ['mcq', 'true_false', 'short_answer', 'essay'],
          materialId: payload.materialId,
        },
        createdBy: userId,
        resourceType: 'exam',
        resourceId: exam.id,
      });

      return {
        ...exam,
        job: {
          jobId: job.jobId,
          status: job.status,
          type: job.type,
        },
      };
    }

    return exam;
  }

  async getExams(
    query: ExamsQueryDto,
    userId: string,
    roles: UserRole[] = [],
  ): Promise<PageDto<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const status = this.toExamStatus(query.status);
    if (query.classId) {
      await this.accessPolicy.assertClassroomAccess(query.classId, userId, roles);
    }

    const where: Prisma.ExamWhereInput = {
      ...(query.classId
        ? { classId: query.classId }
        : roles.includes(UserRole.admin)
          ? {}
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
        include: { creator: { select: userSummarySelect } },
      }),
      this.prisma.exam.count({ where }),
    ]);
    return this.toPage(items, page, limit, total);
  }

  async getExamDetail(
    examId: string,
    userId: string,
    roles: UserRole[] = [],
  ) {
    await this.accessPolicy.assertExamAccess(examId, userId, roles);

    const exam = await this.prisma.exam.findUniqueOrThrow({
      where: { id: examId },
      include: {
        creator: { select: userSummarySelect },
        _count: { select: { questions: true } },
      },
    });
    const { _count, ...rest } = exam;
    return { ...rest, questionsCount: _count.questions };
  }

  async updateExam(
    examId: string,
    payload: UpdateExamDto,
    userId: string,
    roles: UserRole[] = [],
  ) {
    await this.accessPolicy.assertExamManageAccess(examId, userId, roles);

    return this.prisma.exam.update({
      where: { id: examId },
      data: payload,
      include: { creator: { select: userSummarySelect } },
    });
  }

  async deleteExam(examId: string, userId: string, roles: UserRole[] = []) {
    await this.accessPolicy.assertExamManageAccess(examId, userId, roles);

    await this.prisma.$transaction([
      this.prisma.result.deleteMany({ where: { submission: { examId } } }),
      this.prisma.submission.deleteMany({ where: { examId } }),
      this.prisma.question.deleteMany({ where: { examId } }),
      this.prisma.exam.delete({ where: { id: examId } }),
    ]);
    return { id: examId, deleted: true };
  }

  async publishExam(examId: string, userId: string, roles: UserRole[] = []) {
    await this.accessPolicy.assertExamManageAccess(examId, userId, roles);

    const exam = await this.prisma.exam.update({
      where: { id: examId },
      data: { status: ExamStatus.published },
      select: { id: true, status: true, title: true, classId: true },
    });
    await this.notificationsService.createForClass(
      exam.classId,
      'New exam published',
      `${exam.title} is now available.`,
    );
    return { examId: exam.id, status: exam.status };
  }

  async closeExam(examId: string, userId: string, roles: UserRole[] = []) {
    await this.accessPolicy.assertExamManageAccess(examId, userId, roles);

    const exam = await this.prisma.exam.update({
      where: { id: examId },
      data: { status: ExamStatus.archived },
      select: { id: true, title: true, createdBy: true },
    });
    await this.notificationsService.createForUser(
      exam.createdBy,
      'Exam closed',
      `${exam.title} has been closed.`,
    );
    return { examId: exam.id, status: 'closed' };
  }

  async createQuestion(
    examId: string,
    payload: CreateQuestionDto & { generateByAi?: boolean; topic?: string; difficulty?: string; numberOfQuestions?: number; questionTypes?: string[]; materialId?: string },
    userId: string,
    roles: UserRole[] = [],
  ) {
    await this.accessPolicy.assertExamManageAccess(examId, userId, roles);

    const generateByAi = payload.generateByAi ?? false;

    if (generateByAi) {
      const job = await this.jobsService.enqueue({
        type: JobTypes.aiExamGenerate,
        payload: {
          examId,
          topic: payload.topic,
          difficulty: payload.difficulty ?? 'medium',
          numberOfQuestions: payload.numberOfQuestions ?? 5,
          questionTypes: payload.questionTypes ?? ['mcq', 'true_false', 'short_answer', 'essay'],
          materialId: payload.materialId,
        },
        createdBy: userId,
        resourceType: 'exam',
        resourceId: examId,
      });

      return {
        examId,
        job: {
          jobId: job.jobId,
          status: job.status,
          type: job.type,
        },
      };
    }

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

  async getExamQuestions(
    examId: string,
    userId: string,
    roles: UserRole[] = [],
  ) {
    await this.accessPolicy.assertExamAccess(examId, userId, roles);

    return this.prisma.question.findMany({ where: { examId }, orderBy: { orderNo: 'asc' } });
  }

  async getQuestionDetail(
    questionId: string,
    userId: string,
    roles: UserRole[] = [],
  ) {
    await this.assertQuestionExamAccess(questionId, userId, roles);

    return this.prisma.question.findUniqueOrThrow({ where: { id: questionId } });
  }

  async updateQuestion(
    questionId: string,
    payload: UpdateQuestionDto,
    userId: string,
    roles: UserRole[] = [],
  ) {
    await this.assertQuestionExamManageAccess(questionId, userId, roles);

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

  async deleteQuestion(questionId: string, userId: string, roles: UserRole[] = []) {
    await this.assertQuestionExamManageAccess(questionId, userId, roles);

    await this.prisma.question.delete({ where: { id: questionId } });
    return { id: questionId, deleted: true };
  }

  async reorderQuestions(
    payload: ReorderQuestionsDto,
    userId: string,
    roles: UserRole[] = [],
  ) {
    const firstQuestionId = payload.items[0]?.questionId;
    if (firstQuestionId) {
      await this.assertQuestionExamManageAccess(firstQuestionId, userId, roles);
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
    await this.accessPolicy.assertExamAccess(examId, userId, [UserRole.student]);

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

  async getSubmissionDetail(
    submissionId: string,
    userId: string,
    roles: UserRole[] = [],
  ) {
    await this.accessPolicy.assertSubmissionAccess(submissionId, userId, roles);

    return this.prisma.submission.findUniqueOrThrow({
      where: { id: submissionId },
      include: {
        student: { select: userSummarySelect },
        result: true,
        exam: true,
      },
    });
  }

  async autosaveAnswers(
    submissionId: string,
    payload: AnswersDto,
    userId: string,
    roles: UserRole[] = [],
  ) {
    await this.accessPolicy.assertSubmissionOwner(submissionId, userId, roles);

    return this.prisma.submission.update({
      where: { id: submissionId },
      data: { answers: payload.answers as Prisma.InputJsonValue },
    });
  }

  async submitSubmission(
    submissionId: string,
    userId: string,
    roles: UserRole[] = [],
  ) {
    await this.accessPolicy.assertSubmissionOwner(submissionId, userId, roles);

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

  async getResult(
    submissionId: string,
    userId: string,
    roles: UserRole[] = [],
  ) {
    await this.accessPolicy.assertSubmissionAccess(submissionId, userId, roles);

    return this.prisma.result.findUniqueOrThrow({
      where: { submissionId },
      include: {
        submission: {
          select: {
            studentId: true,
            student: { select: userSummarySelect },
          },
        },
      },
    });
  }

  async manualGrade(
    submissionId: string,
    payload: ManualGradeDto,
    userId: string,
    roles: UserRole[] = [],
  ) {
    await this.accessPolicy.assertSubmissionOwnerTeacherOrAdmin(
      submissionId,
      userId,
      roles,
    );

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
      include: {
        submission: {
          select: {
            studentId: true,
            student: { select: userSummarySelect },
          },
        },
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
      );
    }
    return result;
  }

  async getExamAnalytics(examId: string, userId: string, roles: UserRole[] = []) {
    await this.accessPolicy.assertExamManageAccess(examId, userId, roles);

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

  async getQuestionAnalytics(
    examId: string,
    userId: string,
    roles: UserRole[] = [],
  ) {
    await this.accessPolicy.assertExamManageAccess(examId, userId, roles);

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

  async getStudentAnalytics(
    studentId: string,
    userId: string,
    roles: UserRole[] = [],
  ) {
    if (roles.includes(UserRole.admin)) {
      return this.buildStudentAnalytics(studentId);
    }

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

    return this.buildStudentAnalytics(studentId);
  }

  private async buildStudentAnalytics(studentId: string) {
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

  private async assertQuestionExamAccess(
    questionId: string,
    userId: string,
    roles: UserRole[] = [],
  ) {
    const question = await this.prisma.question.findUniqueOrThrow({
      where: { id: questionId },
      select: { examId: true },
    });
    await this.accessPolicy.assertExamAccess(question.examId, userId, roles);
  }

  private async assertQuestionExamManageAccess(
    questionId: string,
    userId: string,
    roles: UserRole[] = [],
  ) {
    const question = await this.prisma.question.findUniqueOrThrow({
      where: { id: questionId },
      select: { examId: true },
    });
    await this.accessPolicy.assertExamManageAccess(question.examId, userId, roles);
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
