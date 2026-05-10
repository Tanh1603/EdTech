import { Injectable } from '@nestjs/common';
import {
  JobStatusValue,
  JobStatuses,
  JobType,
  toIsoString,
} from '@edtech/contracts';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RabbitMqPublisher } from '../queue/rabbitmq.publisher';

export interface EnqueueJobInput {
  type: JobType | string;
  payload?: Record<string, unknown>;
  priority?: number;
  maxAttempts?: number;
  requestId?: string | null;
  correlationId?: string | null;
  createdBy?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
}

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: RabbitMqPublisher,
  ) {}

  async enqueue(input: EnqueueJobInput) {
    const job = (await this.prisma.job.create({
      data: {
        type: input.type,
        status: JobStatuses.queued,
        payload: input.payload as any,
        priority: input.priority ?? 0,
        maxAttempts: input.maxAttempts ?? 3,
        requestId: input.requestId ?? undefined,
        correlationId: input.correlationId ?? undefined,
        createdBy: input.createdBy ?? undefined,
        resourceType: input.resourceType ?? undefined,
        resourceId: input.resourceId ?? undefined,
      } as any,
    })) as any;

    await this.publisher.publishJob({
      jobId: job.id,
      type: job.type,
      payload: job.payload,
      requestId: job.requestId,
      correlationId: job.correlationId,
    });

    return this.toJobResponse(job);
  }

  async getJobStatus(jobId: string) {
    const job = (await this.prisma.job.findUniqueOrThrow({
      where: { id: jobId },
    })) as any;
    return this.toJobResponse(job);
  }

  async updateJobStatus(
    jobId: string,
    status: JobStatusValue | string,
    result?: unknown,
    error?: unknown,
  ) {
    const job = (await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status,
        result: result as any,
        error: error as any,
        finishedAt:
          status === JobStatuses.succeeded ||
          status === JobStatuses.failed ||
          status === JobStatuses.deadLettered ||
          status === JobStatuses.cancelled
            ? new Date()
            : undefined,
      } as any,
    })) as any;
    return this.toJobResponse(job);
  }

  async markRunning(jobId: string) {
    const job = (await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatuses.running,
        attempts: { increment: 1 },
        startedAt: new Date(),
      } as any,
    })) as any;
    return this.toJobResponse(job);
  }

  async markSucceeded(jobId: string, result?: unknown) {
    const job = (await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatuses.succeeded,
        result: result as any,
        error: undefined,
        finishedAt: new Date(),
      } as any,
    })) as any;
    return this.toJobResponse(job);
  }

  async markFailed(jobId: string, error?: unknown) {
    const current = (await this.prisma.job.findUniqueOrThrow({
      where: { id: jobId },
    })) as any;

    if (current.attempts < current.maxAttempts) {
      const delayMs = this.getRetryDelayMs(current.attempts);
      const availableAt = new Date(Date.now() + delayMs);
      const job = (await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: JobStatuses.retrying,
          error: error as any,
          availableAt,
        } as any,
      })) as any;
      await this.publisher.publishJob(
        {
          jobId: job.id,
          type: job.type,
          payload: job.payload,
          requestId: job.requestId,
          correlationId: job.correlationId,
        },
        { delayMs },
      );
      return this.toJobResponse(job);
    }

    const job = (await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatuses.deadLettered,
        error: error as any,
        finishedAt: new Date(),
      } as any,
    })) as any;
    if (job.createdBy) {
      await this.prisma.notification.create({
        data: {
          userId: job.createdBy,
          title: 'Background job failed',
          body: `${job.type} could not be completed.`,
        },
      });
    }
    await this.publisher.publishDeadLetter({
      jobId: job.id,
      type: job.type,
      payload: job.payload,
      requestId: job.requestId,
      correlationId: job.correlationId,
    });
    return this.toJobResponse(job);
  }

  private getRetryDelayMs(attempts: number): number {
    const delaySeconds = Math.min(300, 2 ** Math.max(attempts, 0) * 10);
    return delaySeconds * 1000;
  }

  private toJobResponse(job: any) {
    return {
      id: job.id,
      jobId: job.id,
      type: job.type,
      status: job.status,
      priority: job.priority,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      payload: job.payload,
      result: job.result,
      error: job.error,
      requestId: job.requestId,
      correlationId: job.correlationId,
      createdBy: job.createdBy,
      resourceType: job.resourceType,
      resourceId: job.resourceId,
      availableAt: toIsoString(job.availableAt),
      startedAt: toIsoString(job.startedAt),
      finishedAt: toIsoString(job.finishedAt),
      createdAt: toIsoString(job.createdAt),
      updatedAt: toIsoString(job.updatedAt),
    };
  }
}
