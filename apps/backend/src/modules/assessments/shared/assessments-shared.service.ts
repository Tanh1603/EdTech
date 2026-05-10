import { Injectable } from '@nestjs/common';
import { PageDto } from '@edtech/contracts';
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

@Injectable()
export class AssessmentsSharedService {
  constructor(private readonly prisma: PrismaService) {}

  async createExam(payload: CreateExamDto, userId: string) {
    return this.prisma.exam.create({
      data: { ...payload, createdBy: userId },
      select: { id: true, title: true, status: true },
    });
  }

  async getExams(query: ExamsQueryDto): Promise<PageDto<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const status = this.toExamStatus(query.status);
    const where: Prisma.ExamWhereInput = {
      ...(query.classId ? { classId: query.classId } : {}),
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

  async getExamDetail(examId: string) {
    const exam = await this.prisma.exam.findUniqueOrThrow({
      where: { id: examId },
      include: { _count: { select: { questions: true } } },
    });
    const { _count, ...rest } = exam;
    return { ...rest, questionsCount: _count.questions };
  }

  updateExam(examId: string, payload: UpdateExamDto) {
    return this.prisma.exam.update({ where: { id: examId }, data: payload });
  }

  async deleteExam(examId: string) {
    await this.prisma.$transaction([
      this.prisma.result.deleteMany({ where: { submission: { examId } } }),
      this.prisma.submission.deleteMany({ where: { examId } }),
      this.prisma.question.deleteMany({ where: { examId } }),
      this.prisma.exam.delete({ where: { id: examId } }),
    ]);
    return { id: examId, deleted: true };
  }

  async publishExam(examId: string) {
    const exam = await this.prisma.exam.update({
      where: { id: examId },
      data: { status: ExamStatus.published },
      select: { id: true, status: true },
    });
    return { examId: exam.id, status: exam.status };
  }

  async closeExam(examId: string) {
    const exam = await this.prisma.exam.update({
      where: { id: examId },
      data: { status: ExamStatus.archived },
      select: { id: true },
    });
    return { examId: exam.id, status: 'closed' };
  }

  createQuestion(examId: string, payload: CreateQuestionDto) {
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

  getExamQuestions(examId: string) {
    return this.prisma.question.findMany({ where: { examId }, orderBy: { orderNo: 'asc' } });
  }

  getQuestionDetail(questionId: string) {
    return this.prisma.question.findUniqueOrThrow({ where: { id: questionId } });
  }

  updateQuestion(questionId: string, payload: UpdateQuestionDto) {
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

  async deleteQuestion(questionId: string) {
    await this.prisma.question.delete({ where: { id: questionId } });
    return { id: questionId, deleted: true };
  }

  async reorderQuestions(payload: ReorderQuestionsDto) {
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

  getSubmissionDetail(submissionId: string) {
    return this.prisma.submission.findUniqueOrThrow({
      where: { id: submissionId },
      include: { result: true, exam: true },
    });
  }

  autosaveAnswers(submissionId: string, payload: AnswersDto) {
    return this.prisma.submission.update({
      where: { id: submissionId },
      data: { answers: payload.answers as Prisma.InputJsonValue },
    });
  }

  async submitSubmission(submissionId: string) {
    const submission = await this.prisma.submission.update({
      where: { id: submissionId },
      data: { status: SubmissionStatus.submitted, submittedAt: new Date() },
      select: { id: true, status: true },
    });
    return { submissionId: submission.id, status: submission.status };
  }

  getResult(submissionId: string) {
    return this.prisma.result.findUniqueOrThrow({ where: { submissionId } });
  }

  async manualGrade(submissionId: string, payload: ManualGradeDto) {
    return this.prisma.result.upsert({
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
  }

  async getExamAnalytics(examId: string) {
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

  async getQuestionAnalytics(examId: string) {
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

  async getStudentAnalytics(studentId: string) {
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
