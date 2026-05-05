import { Injectable } from '@nestjs/common';
import { JobStatus, JobType, NotifyStatus, UserStatus } from '../../../generated/prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { ExportAnalyticsDto } from '../dto/export-analytics.dto';

@Injectable()
export class OpsService {
  constructor(private readonly prisma: PrismaService) {}

  async getJobStatus(jobId: string) {
    return this.prisma.job.findUniqueOrThrow({ where: { id: jobId } });
  }

  async getStudentAnalytics() {
    const latest = await this.prisma.analyticsSnapshot.findFirst({
      where: { scope: 'student' },
      orderBy: { id: 'desc' },
    });
    return {
      scope: 'student',
      generatedAt: new Date().toISOString(),
      metrics: latest?.metrics ?? {},
      charts: [],
      recommendations: [],
    };
  }

  async getClassAnalytics(classId: string) {
    const mastery = await this.prisma.studentTopicMastery.findMany({
      where: { classId },
      take: 50,
    });
    return {
      scope: 'class',
      generatedAt: new Date().toISOString(),
      metrics: { classId, masteryCount: mastery.length },
      charts: [{ type: 'mastery', data: mastery }],
      recommendations: [],
    };
  }

  async exportAnalytics(payload: ExportAnalyticsDto) {
    const job = await this.prisma.job.create({
      data: {
        type: JobType.analytics_export,
        status: JobStatus.queued,
        payload: {
          scope: payload.scope,
          classId: payload.classId ?? null,
          format: payload.format,
        },
      },
    });
    return { jobId: job.id, status: JobStatus.queued };
  }

  async getNotifications(page: number, limit: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.notificationRecipient.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: 'desc' },
        include: { notification: true },
      }),
      this.prisma.notificationRecipient.count(),
    ]);
    return { items, page, limit, total };
  }

  async createNotification(payload: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        title: payload.title,
        body: payload.body,
        type: payload.audience.type,
      },
    });

    await this.prisma.notificationRecipient.createMany({
      data: payload.audience.values.map((value) => ({
        notificationId: notification.id,
        userId: payload.audience.type === 'user_ids' ? value : null,
        status: NotifyStatus.queued,
      })),
    });

    const job = await this.prisma.job.create({
      data: {
        type: JobType.notification_dispatch,
        status: JobStatus.queued,
        payload: { notificationId: notification.id },
      },
    });
    return { jobId: job.id, status: JobStatus.queued };
  }

  async getAdminMetrics() {
    const [activeUsers, queuedJobs] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { status: UserStatus.active } }),
      this.prisma.job.count({ where: { status: JobStatus.queued } }),
    ]);
    return {
      activeUsers,
      reqPerMin: 0,
      avgLatencyMs: 0,
      errorRate: 0,
      queuedJobs,
    };
  }

  getAgentsMonitor() {
    return { agents: [], queueDepth: 0 };
  }

  async getAdminLogs(page: number, limit: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count(),
    ]);
    return { items, page, limit, total };
  }
}

