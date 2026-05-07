import { Injectable } from '@nestjs/common';
import { PageDto } from '../../common/dto/page.dto';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  ExamStatus,
  Prisma,
  QuestionType,
  SubmissionStatus,
} from '../../generated/prisma/client';
import { CreateExamDto, UpdateExamDto } from './dto/exam.dto';
import { ExamsQueryDto, ResultsQueryDto, SubmissionsQueryDto } from './dto/query.dto';
import { CreateQuestionDto, ReorderQuestionsDto, UpdateQuestionDto } from './dto/question.dto';
import { AutoSaveAnswersDto, BulkAiGradingDto, ProctoringEventDto, SubmitExamDto } from './dto/submission.dto';

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createExam(payload: CreateExamDto, userId: string) {
    return this.prisma.exam.create({
      data: { ...payload, createdBy: userId },
      select: { id: true, status: true },
    });
  }

  async getExams(query: ExamsQueryDto): Promise<PageDto<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const status = this.toExamStatus(query.status);
    const where: Prisma.ExamWhereInput = {
      ...(query.classId ? { classId: query.classId } : {}),
      ...(status ? { status } : {}),
      ...(query.search
        ? { title: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.exam.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
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

  async updateExam(examId: string, payload: UpdateExamDto) {
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

  async archiveExam(examId: string) {
    const exam = await this.prisma.exam.update({
      where: { id: examId },
      data: { status: ExamStatus.archived },
      select: { id: true, status: true },
    });
    return { examId: exam.id, status: exam.status };
  }

  async duplicateExam(examId: string, userId: string) {
    const exam = await this.prisma.exam.findUniqueOrThrow({
      where: { id: examId },
      include: { questions: true },
    });
    const created = await this.prisma.exam.create({
      data: {
        classId: exam.classId,
        title: `${exam.title} (Copy)`,
        description: exam.description,
        duration: exam.duration,
        createdBy: userId,
        questions: {
          create: exam.questions.map((question) => ({
            type: question.type,
            prompt: question.prompt,
            options: question.options as Prisma.InputJsonValue,
            answerKey: question.answerKey as Prisma.InputJsonValue,
            explanation: question.explanation,
            points: question.points,
            orderNo: question.orderNo,
          })),
        },
      },
      select: { id: true },
    });
    return { newExamId: created.id };
  }

  async createQuestion(examId: string, payload: CreateQuestionDto) {
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

  async getExamQuestions(examId: string) {
    return this.prisma.question.findMany({ where: { examId }, orderBy: { orderNo: 'asc' } });
  }

  async getQuestionDetail(questionId: string) {
    return this.prisma.question.findUniqueOrThrow({ where: { id: questionId } });
  }

  async updateQuestion(questionId: string, payload: UpdateQuestionDto) {
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

  async getMyExams(status: string | undefined, userId: string) {
    const submissionStatus = this.toSubmissionStatus(status);
    return this.prisma.exam.findMany({
      where: {
        submissions: { some: { studentId: userId, ...(submissionStatus ? { status: submissionStatus } : {}) } },
      },
      include: { submissions: { where: { studentId: userId } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyExamDetail(examId: string, userId: string) {
    return this.prisma.exam.findFirstOrThrow({
      where: { id: examId, submissions: { some: { studentId: userId } } },
      include: { questions: { orderBy: { orderNo: 'asc' } }, submissions: { where: { studentId: userId } } },
    });
  }

  async startExam(examId: string, userId: string) {
    const submission = await this.prisma.submission.upsert({
      where: { examId_studentId: { examId, studentId: userId } },
      create: { examId, studentId: userId },
      update: {},
    });
    return { submissionId: submission.id, startAt: submission.startAt };
  }

  async submitExam(examId: string, payload: SubmitExamDto, userId: string) {
    const submission = await this.prisma.submission.upsert({
      where: { examId_studentId: { examId, studentId: userId } },
      create: { examId, studentId: userId, answers: payload.answers as Prisma.InputJsonValue, status: SubmissionStatus.submitted, submittedAt: new Date() },
      update: { answers: payload.answers as Prisma.InputJsonValue, status: SubmissionStatus.submitted, submittedAt: new Date() },
    });
    return { submissionId: submission.id, status: submission.status };
  }

  async autoSaveExam(examId: string, payload: AutoSaveAnswersDto, userId: string) {
    return this.prisma.submission.upsert({
      where: { examId_studentId: { examId, studentId: userId } },
      create: { examId, studentId: userId, answers: payload.answers as Prisma.InputJsonValue },
      update: { answers: payload.answers as Prisma.InputJsonValue },
    });
  }

  async getSubmissions(query: SubmissionsQueryDto): Promise<PageDto<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const status = this.toSubmissionStatus(query.status);
    const where: Prisma.SubmissionWhereInput = {
      ...(query.examId ? { examId: query.examId } : {}),
      ...(query.studentId ? { studentId: query.studentId } : {}),
      ...(status ? { status } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.submission.findMany({ where, skip: (page - 1) * limit, take: limit, include: { result: true }, orderBy: { startAt: 'desc' } }),
      this.prisma.submission.count({ where }),
    ]);
    return this.toPage(items, page, limit, total);
  }

  async getSubmissionDetail(submissionId: string) {
    return this.prisma.submission.findUniqueOrThrow({ where: { id: submissionId }, include: { result: true, exam: true } });
  }

  async regradeSubmission(submissionId: string) {
    const job = await this.createGradingJob([submissionId]);
    return { submissionId, status: 'regrading', jobId: job.id };
  }

  async getResult(submissionId: string) {
    return this.prisma.result.findUniqueOrThrow({ where: { submissionId } });
  }

  async getMyResults(query: ResultsQueryDto, userId: string): Promise<PageDto<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ResultWhereInput = {
      submission: { studentId: userId, ...(query.classId ? { exam: { classId: query.classId } } : {}) },
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.result.findMany({ where, skip: (page - 1) * limit, take: limit, include: { submission: true }, orderBy: { gradedAt: 'desc' } }),
      this.prisma.result.count({ where }),
    ]);
    return this.toPage(items, page, limit, total);
  }

  async getResultsAnalytics() {
    const aggregate = await this.prisma.result.aggregate({
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

  async triggerAiGrading(submissionId: string) {
    const job = await this.createGradingJob([submissionId]);
    return { submissionId, status: 'processing', jobId: job.id };
  }

  async triggerBulkAiGrading(payload: BulkAiGradingDto) {
    const job = await this.createGradingJob(payload.submissionIds);
    return { jobId: job.id, status: 'processing' };
  }

  async getGradingJob(jobId: string) {
    const job = await this.prisma.job.findUniqueOrThrow({ where: { id: jobId } });
    return { jobId: job.id, status: job.status, progress: job.status === 'completed' ? 100 : 0 };
  }

  async trackProctoringEvent(payload: ProctoringEventDto) {
    return this.prisma.job.create({
      data: { type: 'anti_cheat_analysis', status: 'queued', payload: payload as unknown as Prisma.InputJsonValue },
    });
  }

  async getProctoringRisk(submissionId: string) {
    const events = await this.prisma.job.findMany({
      where: { type: 'anti_cheat_analysis', payload: { path: ['submissionId'], equals: submissionId } as any },
      orderBy: { createdAt: 'desc' },
    });
    return { riskLevel: events.length >= 3 ? 'high' : events.length > 0 ? 'medium' : 'low', events };
  }

  private createGradingJob(submissionIds: string[]) {
    return this.prisma.job.create({
      data: { type: 'auto_grading', status: 'queued', payload: { submissionIds } },
    });
  }

  private toExamStatus(status?: string): ExamStatus | undefined {
    if (!status) return undefined;
    if (status in ExamStatus) return status as ExamStatus;
    return undefined;
  }

  private toSubmissionStatus(status?: string): SubmissionStatus | undefined {
    if (!status) return undefined;
    if (status in SubmissionStatus) return status as SubmissionStatus;
    return undefined;
  }

  private toQuestionType(type: string): QuestionType {
    const aliases: Record<string, QuestionType> = {
      multiple_choice: QuestionType.mcq,
      single_choice: QuestionType.mcq,
      fill_blank: QuestionType.short_answer,
    };
    if (type in QuestionType) return type as QuestionType;
    return aliases[type] ?? QuestionType.short_answer;
  }

  private toPage<T>(items: T[], page: number, limit: number, total: number): PageDto<T> {
    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
