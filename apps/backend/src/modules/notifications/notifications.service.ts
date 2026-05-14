import { HttpStatus, Injectable } from '@nestjs/common';
import {
  CreateNotificationDto,
  JobTypes,
  NotificationAudienceTypes,
  NotificationQueryDto,
  PageDto,
} from '@edtech/contracts';
import { AppHttpException } from '../../common/errors/app-http.exception';
import { PrismaService } from '../../common/prisma/prisma.service';
import { userSummarySelect } from '../../common/rbac/rbac.mapper';
import { JobsService } from '../jobs/jobs.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobsService: JobsService,
  ) {}

  async createNotification(payload: CreateNotificationDto, createdBy: string) {
    const userIds = await this.resolveAudience(payload.audience);
    const created = await this.createForUsers(
      userIds,
      payload.title,
      payload.body,
    );
    const job = await this.jobsService.enqueue({
      type: JobTypes.notificationDispatch,
      payload: {
        title: payload.title,
        body: payload.body,
        audience: payload.audience,
        notificationIds: created.notificationIds,
        recipients: userIds.length,
        created: created.count,
        createdBy,
        resourceType: payload.resourceType,
        resourceId: payload.resourceId,
      },
      createdBy,
      resourceType: payload.resourceType ?? 'notification',
      resourceId: payload.resourceId,
    });

    return {
      jobId: job.jobId,
      status: job.status,
      type: job.type,
      resourceId: job.resourceId,
      recipients: userIds.length,
      created: created.count,
      notificationIds: created.notificationIds,
    };
  }

  createForUser(
    userId: string,
    title: string,
    body: string,
  ) {
    return this.prisma.notification.create({
      data: { userId, title, body },
      include: { user: { select: userSummarySelect } },
    });
  }

  async createForUsers(
    userIds: string[],
    title: string,
    body: string,
  ) {
    const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
    if (uniqueUserIds.length === 0) {
      return { count: 0 };
    }

    const notifications = await this.prisma.$transaction(
      uniqueUserIds.map((userId) =>
        this.prisma.notification.create({
          data: { userId, title, body },
          select: { id: true },
        }),
      ),
    );

    return {
      count: notifications.length,
      notificationIds: notifications.map((notification) => notification.id),
    };
  }

  async markPrecreatedDispatchSucceeded(payload: {
    notificationIds?: string[];
    recipients?: number;
    created?: number;
  }) {
    const notificationIds = payload.notificationIds ?? [];

    return {
      recipients: payload.recipients ?? notificationIds.length,
      created: payload.created ?? notificationIds.length,
      notificationIds,
      precreated: true,
    };
  }

  async dispatch(payload: {
    title: string;
    body: string;
    audience?: { type: string; values: string[] };
    emails?: string[];
    createdBy?: string;
    resourceType?: string;
    resourceId?: string;
    notificationIds?: string[];
    recipients?: number;
    created?: number;
  }) {
    if (payload.notificationIds?.length) {
      return this.markPrecreatedDispatchSucceeded({
        notificationIds: payload.notificationIds,
        recipients: payload.recipients,
        created: payload.created,
      });
    }

    if (!payload.audience && payload.emails?.length) {
      return {
        recipients: 0,
        created: 0,
        pendingEmailRecipients: payload.emails.length,
      };
    }

    if (!payload.audience) {
      throw new AppHttpException(
        'VALIDATION_ERROR',
        'notification.dispatch payload requires audience',
        HttpStatus.BAD_REQUEST,
      );
    }

    const userIds = await this.resolveAudience(payload.audience);
    const result = await this.createForUsers(userIds, payload.title, payload.body);

    return {
      recipients: userIds.length,
      created: result.count,
      notificationIds: result.notificationIds,
    };
  }

  async createForClass(
    classId: string,
    title: string,
    body: string,
  ) {
    const userIds = await this.getClassStudentUserIds(classId);
    return this.createForUsers(userIds, title, body);
  }

  async listMyNotifications(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<PageDto<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const isRead =
      query.isRead === undefined ? undefined : query.isRead === 'true';
    const where = {
      userId,
      ...(isRead === undefined ? {} : { isRead }),
    };

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: userSummarySelect } },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirstOrThrow({
      where: { id: notificationId, userId },
    });

    return this.prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true },
      include: { user: { select: userSummarySelect } },
    });
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { updated: result.count };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  private async resolveAudience(audience: { type: string; values: string[] }) {
    if (audience.type === NotificationAudienceTypes.userIds) {
      return audience.values;
    }

    if (audience.type === NotificationAudienceTypes.classId) {
      const classId = audience.values[0];
      if (!classId) {
        throw new AppHttpException(
          'VALIDATION_ERROR',
          'class_id audience requires one class id',
          HttpStatus.BAD_REQUEST,
        );
      }
      return this.getClassStudentUserIds(classId);
    }

    throw new AppHttpException(
      'VALIDATION_ERROR',
      'role audience is not supported until user role persistence is available',
      HttpStatus.BAD_REQUEST,
    );
  }

  private async getClassStudentUserIds(classId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { classId, role: 'student' },
      select: { userId: true },
    });
    return enrollments.map((enrollment) => enrollment.userId);
  }
}
