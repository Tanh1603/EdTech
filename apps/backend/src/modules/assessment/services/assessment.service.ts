import { Injectable } from '@nestjs/common';
import { ExamStatus, JobStatus, JobType } from '../../../generated/prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { GenerateExamDto } from '../dto/generate-exam.dto';
import { OverrideResultDto } from '../dto/override-result.dto';
import { ResultsQueryDto } from '../dto/results-query.dto';
import { StartAttemptDto } from '../dto/start-attempt.dto';
import { SubmitAttemptDto } from '../dto/submit-attempt.dto';
import { UpdateExamDto } from '../dto/update-exam.dto';

@Injectable()
export class AssessmentService {
  constructor(private readonly prisma: PrismaService) {}

  async generateExam(payload: GenerateExamDto, creatorId: string) {
    return this.prisma.exam.create({
      data: {
        classId: payload.classId,
        createdBy: creatorId,
        title: payload.title,
        duration: payload.durationMinutes,
        personalized: payload.personalized ?? false,
      },
    });
  }

  async updateExam(examId: string, payload: UpdateExamDto) {
    return this.prisma.exam.update({
      where: { id: examId },
      data: {
        title: payload.title,
        duration: payload.durationMinutes,
      },
    });
  }

  async publishExam(examId: string) {
    return this.prisma.exam.update({
      where: { id: examId },
      data: { status: ExamStatus.published, publishedAt: new Date() },
    });
  }

  async startAttempt(examId: string, payload: StartAttemptDto) {
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + 60 * 60 * 1000);
    return this.prisma.submission.create({
      data: {
        examId,
        studentId: payload.studentId,
        startedAt,
        submittedAt: expiresAt,
      },
    });
  }

  async submitAttempt(attemptId: string, payload: SubmitAttemptDto) {
    const result = await this.prisma.result.upsert({
      where: { submissionId: attemptId },
      create: {
        submissionId: attemptId,
        objectiveScore: payload.answers.length,
        totalScore: payload.answers.length,
      },
      update: {
        objectiveScore: payload.answers.length,
        totalScore: payload.answers.length,
      },
    });
    const gradingJob = await this.prisma.job.create({
      data: {
        type: JobType.ai_grade,
        status: JobStatus.queued,
        payload: { attemptId },
      },
    });

    return {
      immediateResult: result,
      gradingJob: { jobId: gradingJob.id },
      proctorJob: { jobId: gradingJob.id },
    };
  }

  async getResults(query: ResultsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = {
      submission: {
        ...(query.examId ? { examId: query.examId } : {}),
        ...(query.studentId ? { studentId: query.studentId } : {}),
      },
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.result.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { gradedAt: 'desc' },
      }),
      this.prisma.result.count({ where }),
    ]);
    return { items, page, limit, total };
  }

  async overrideResult(resultId: string, payload: OverrideResultDto) {
    return this.prisma.result.update({
      where: { id: resultId },
      data: {
        totalScore: payload.score,
      },
    });
  }
}

