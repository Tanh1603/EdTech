import { JobStatuses, JobTypes, UserRole } from '@edtech/contracts';
import { AppHttpException } from '../../common/errors/app-http.exception';

jest.mock('../../common/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { JobsService } from './jobs.service';

describe('JobsService', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');

  function createJob(overrides: Record<string, unknown> = {}) {
    return {
      id: 'job-1',
      type: JobTypes.notificationDispatch,
      status: JobStatuses.queued,
      priority: 0,
      attempts: 0,
      maxAttempts: 3,
      payload: { classId: 'class-1' },
      result: null,
      error: null,
      requestId: 'req-1',
      correlationId: 'corr-1',
      createdBy: 'user-1',
      resourceType: 'classroom',
      resourceId: 'class-1',
      availableAt: now,
      startedAt: null,
      finishedAt: null,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  it('creates a queued DB job and publishes it to RabbitMQ', async () => {
    const prisma = {
      job: {
        create: jest.fn().mockResolvedValue(createJob()),
      },
    };
    const publisher = {
      publishJob: jest.fn().mockResolvedValue(undefined),
      publishDeadLetter: jest.fn(),
    };
    const service = new JobsService(prisma as any, publisher as any);

    const result = await service.enqueue({
      type: JobTypes.notificationDispatch,
      payload: { classId: 'class-1' },
      requestId: 'req-1',
      correlationId: 'corr-1',
      createdBy: 'user-1',
      resourceType: 'classroom',
      resourceId: 'class-1',
    });

    expect(prisma.job.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: JobTypes.notificationDispatch,
          status: JobStatuses.queued,
          payload: { classId: 'class-1' },
        }),
      }),
    );
    expect(publisher.publishJob).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 'job-1',
        type: JobTypes.notificationDispatch,
      }),
    );
    expect(result).toMatchObject({
      jobId: 'job-1',
      status: JobStatuses.queued,
      type: JobTypes.notificationDispatch,
    });
  });

  it('marks jobs succeeded with result and finishedAt', async () => {
    const prisma = {
      job: {
        update: jest.fn().mockResolvedValue(
          createJob({
            status: JobStatuses.succeeded,
            result: { ok: true },
            finishedAt: now,
          }),
        ),
      },
    };
    const service = new JobsService(
      prisma as any,
      {
        publishJob: jest.fn(),
        publishDeadLetter: jest.fn(),
      } as any,
    );

    const result = await service.markSucceeded('job-1', { ok: true });

    expect(prisma.job.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-1' },
        data: expect.objectContaining({
          status: JobStatuses.succeeded,
          result: { ok: true },
        }),
      }),
    );
    expect(result.status).toBe(JobStatuses.succeeded);
  });

  it('returns job status for the user that created the job', async () => {
    const prisma = {
      job: {
        findUniqueOrThrow: jest.fn().mockResolvedValue(createJob()),
      },
    };
    const service = new JobsService(
      prisma as any,
      {
        publishJob: jest.fn(),
        publishDeadLetter: jest.fn(),
      } as any,
    );

    const result = await service.getJobStatusForUser('job-1', 'user-1', [
      UserRole.student,
    ]);

    expect(prisma.job.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'job-1' },
    });
    expect(result.jobId).toBe('job-1');
  });

  it('allows admins to read any job status', async () => {
    const prisma = {
      job: {
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue(createJob({ createdBy: 'user-2' })),
      },
    };
    const service = new JobsService(
      prisma as any,
      {
        publishJob: jest.fn(),
        publishDeadLetter: jest.fn(),
      } as any,
    );

    await expect(
      service.getJobStatusForUser('job-1', 'admin-1', [UserRole.admin]),
    ).resolves.toMatchObject({ jobId: 'job-1' });
  });

  it('rejects job status access for unrelated users', async () => {
    const prisma = {
      job: {
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue(createJob({ createdBy: 'user-2' })),
      },
    };
    const service = new JobsService(
      prisma as any,
      {
        publishJob: jest.fn(),
        publishDeadLetter: jest.fn(),
      } as any,
    );

    await expect(
      service.getJobStatusForUser('job-1', 'user-1', [UserRole.student]),
    ).rejects.toBeInstanceOf(AppHttpException);
  });

  it('dead-letters a failed job when max attempts is reached', async () => {
    const deadLettered = createJob({
      status: JobStatuses.deadLettered,
      attempts: 3,
      error: { message: 'failed' },
      finishedAt: now,
    });
    const prisma = {
      job: {
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue(createJob({ attempts: 3, maxAttempts: 3 })),
        update: jest.fn().mockResolvedValue(deadLettered),
      },
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'notification-1' }),
      },
    };
    const publisher = {
      publishJob: jest.fn(),
      publishDeadLetter: jest.fn().mockResolvedValue(undefined),
    };
    const service = new JobsService(prisma as any, publisher as any);

    const result = await service.markFailed('job-1', { message: 'failed' });

    expect(result.status).toBe(JobStatuses.deadLettered);
    expect(publisher.publishDeadLetter).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: 'job-1' }),
    );
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          title: 'Background job failed',
        }),
      }),
    );
  });
});
