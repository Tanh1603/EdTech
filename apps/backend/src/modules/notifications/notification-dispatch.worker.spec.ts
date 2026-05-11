import { JobQueues } from '@edtech/contracts';

jest.mock('../../common/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { NotificationDispatchWorker } from './notification-dispatch.worker';

describe('NotificationDispatchWorker', () => {
  it('consumes notification.dispatch jobs and marks them succeeded', async () => {
    let handler: ((message: Record<string, unknown>) => Promise<void>) | undefined;
    const consumer = {
      consume: jest.fn().mockImplementation((_queue, callback) => {
        handler = callback;
        return Promise.resolve();
      }),
    };
    const jobsService = {
      markRunning: jest.fn().mockResolvedValue(undefined),
      markSucceeded: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
    };
    const notificationsService = {
      dispatch: jest.fn().mockResolvedValue({
        recipients: 2,
        created: 2,
        notificationIds: ['notification-1', 'notification-2'],
        precreated: true,
      }),
    };
    const worker = new NotificationDispatchWorker(
      { get: jest.fn().mockReturnValue('true') } as any,
      consumer as any,
      jobsService as any,
      notificationsService as any,
    );

    await worker.onModuleInit();
    await handler?.({
      jobId: 'job-1',
      payload: {
        title: 'Hello',
        body: 'Body',
        audience: { type: 'user_ids', values: ['user-1', 'user-2'] },
      },
    });

    expect(consumer.consume).toHaveBeenCalledWith(
      JobQueues.notificationDispatch,
      expect.any(Function),
    );
    expect(jobsService.markRunning).toHaveBeenCalledWith('job-1');
    expect(notificationsService.dispatch).toHaveBeenCalled();
    expect(jobsService.markSucceeded).toHaveBeenCalledWith(
      'job-1',
      expect.objectContaining({
        recipients: 2,
        created: 2,
        notificationIds: ['notification-1', 'notification-2'],
        precreated: true,
      }),
    );
  });

  it('marks jobs failed when dispatch throws', async () => {
    let handler: ((message: Record<string, unknown>) => Promise<void>) | undefined;
    const consumer = {
      consume: jest.fn().mockImplementation((_queue, callback) => {
        handler = callback;
        return Promise.resolve();
      }),
    };
    const jobsService = {
      markRunning: jest.fn().mockResolvedValue(undefined),
      markSucceeded: jest.fn(),
      markFailed: jest.fn().mockResolvedValue(undefined),
    };
    const notificationsService = {
      dispatch: jest.fn().mockRejectedValue(new Error('invalid audience')),
    };
    const worker = new NotificationDispatchWorker(
      { get: jest.fn().mockReturnValue(true) } as any,
      consumer as any,
      jobsService as any,
      notificationsService as any,
    );

    await worker.onModuleInit();
    await handler?.({ jobId: 'job-1', payload: {} });

    expect(jobsService.markFailed).toHaveBeenCalledWith('job-1', {
      message: 'invalid audience',
    });
  });
});
