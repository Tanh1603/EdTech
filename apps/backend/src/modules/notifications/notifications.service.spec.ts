import {
  JobTypes,
  NotificationAudienceTypes,
} from '@edtech/contracts';

jest.mock('../../common/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  it('creates a notification for a user', async () => {
    const prisma = {
      notification: {
        create: jest.fn().mockResolvedValue({
          id: 'notification-1',
          userId: 'user-1',
          title: 'Hello',
          body: 'Body',
          isRead: false,
        }),
      },
    };
    const service = new NotificationsService(prisma as any, {} as any);

    const result = await service.createForUser('user-1', 'Hello', 'Body');

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', title: 'Hello', body: 'Body' },
    });
    expect(result).toMatchObject({ userId: 'user-1', isRead: false });
  });

  it('resolves class audience into student notifications', async () => {
    const prisma = {
      enrollment: {
        findMany: jest.fn().mockResolvedValue([
          { userId: 'student-1' },
          { userId: 'student-2' },
        ]),
      },
      notification: {
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const service = new NotificationsService(prisma as any, {} as any);

    const result = await service.dispatch({
      title: 'Exam',
      body: 'New exam',
      audience: {
        type: NotificationAudienceTypes.classId,
        values: ['class-1'],
      },
    });

    expect(prisma.enrollment.findMany).toHaveBeenCalledWith({
      where: { classId: 'class-1', role: 'student' },
      select: { userId: true },
    });
    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: [
        { userId: 'student-1', title: 'Exam', body: 'New exam' },
        { userId: 'student-2', title: 'Exam', body: 'New exam' },
      ],
      skipDuplicates: false,
    });
    expect(result).toEqual({ recipients: 2, created: 2 });
  });

  it('marks only current user notification as read', async () => {
    const prisma = {
      notification: {
        findFirstOrThrow: jest.fn().mockResolvedValue({
          id: 'notification-1',
          userId: 'user-1',
        }),
        update: jest.fn().mockResolvedValue({
          id: 'notification-1',
          isRead: true,
        }),
      },
    };
    const service = new NotificationsService(prisma as any, {} as any);

    await service.markRead('user-1', 'notification-1');

    expect(prisma.notification.findFirstOrThrow).toHaveBeenCalledWith({
      where: { id: 'notification-1', userId: 'user-1' },
    });
    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'notification-1' },
      data: { isRead: true },
    });
  });

  it('enqueues manual notification dispatch jobs', async () => {
    const jobsService = {
      enqueue: jest.fn().mockResolvedValue({
        jobId: 'job-1',
        status: 'queued',
        type: JobTypes.notificationDispatch,
        resourceId: 'class-1',
      }),
    };
    const service = new NotificationsService({} as any, jobsService as any);

    const result = await service.enqueueNotification(
      {
        title: 'Announcement',
        body: 'Read this',
        audience: {
          type: NotificationAudienceTypes.classId,
          values: ['class-1'],
        },
        resourceType: 'classroom',
        resourceId: 'class-1',
      },
      'teacher-1',
    );

    expect(jobsService.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: JobTypes.notificationDispatch,
        createdBy: 'teacher-1',
      }),
    );
    expect(result).toMatchObject({ jobId: 'job-1', status: 'queued' });
  });
});

