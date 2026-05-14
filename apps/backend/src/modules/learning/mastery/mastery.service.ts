import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { userSummarySelect } from '../../../common/rbac/rbac.mapper';
import { BulkUpsertMasteryDto } from '@edtech/contracts';
import { UpsertMasteryDto } from '@edtech/contracts';

@Injectable()
export class MasteryService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyMastery(userId: string) {
    return this.prisma.studentTopicMastery.findMany({
      where: { studentId: userId },
      include: { student: { select: userSummarySelect } },
      orderBy: [{ classId: 'asc' }, { topic: 'asc' }],
    });
  }

  async getMasteryByClass(classId: string) {
    return this.prisma.studentTopicMastery.findMany({
      where: { classId },
      include: { student: { select: userSummarySelect } },
      orderBy: [{ studentId: 'asc' }, { masteryScore: 'asc' }],
    });
  }

  async getMasteryByTopic(topic: string, userId: string) {
    return this.prisma.studentTopicMastery.findMany({
      where: { topic, studentId: userId },
      include: { student: { select: userSummarySelect } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getMasteryAnalytics(userId: string) {
    const items = await this.prisma.studentTopicMastery.findMany({
      where: { studentId: userId },
      include: { student: { select: userSummarySelect } },
      orderBy: { masteryScore: 'asc' },
    });

    const averageMastery =
      items.length === 0
        ? 0
        : items.reduce((sum, item) => sum + item.masteryScore, 0) /
          items.length;

    return {
      averageMastery,
      strongestTopics: [...items]
        .sort((a, b) => b.masteryScore - a.masteryScore)
        .slice(0, 5),
      weakestTopics: items.slice(0, 5),
    };
  }

  async upsertMastery(payload: UpsertMasteryDto) {
    return this.prisma.studentTopicMastery.upsert({
      where: {
        studentId_classId_topic: {
          studentId: payload.studentId,
          classId: payload.classId,
          topic: payload.topic,
        },
      },
      create: payload,
      update: { masteryScore: payload.masteryScore },
      include: { student: { select: userSummarySelect } },
    });
  }

  async bulkUpsertMastery(payload: BulkUpsertMasteryDto) {
    const items = await this.prisma.$transaction(
      payload.items.map((item) =>
        this.prisma.studentTopicMastery.upsert({
          where: {
            studentId_classId_topic: {
              studentId: item.studentId,
              classId: item.classId,
              topic: item.topic,
            },
          },
          create: item,
          update: { masteryScore: item.masteryScore },
          include: { student: { select: userSummarySelect } },
        }),
      ),
    );

    return { items };
  }

  async getRiskStudents() {
    const weakItems = await this.prisma.studentTopicMastery.findMany({
      where: { masteryScore: { lt: 0.5 } },
      include: { student: { select: userSummarySelect } },
      orderBy: { masteryScore: 'asc' },
    });

    const grouped = new Map<
      string,
      { studentId: string; student?: unknown; weakTopics: string[] }
    >();

    weakItems.forEach((item) => {
      const current = grouped.get(item.studentId) ?? {
        studentId: item.studentId,
        student: item.student,
        weakTopics: [],
      };
      current.weakTopics.push(item.topic);
      grouped.set(item.studentId, current);
    });

    return {
      students: Array.from(grouped.values()).map((student) => ({
        ...student,
        riskLevel: student.weakTopics.length >= 3 ? 'high' : 'medium',
      })),
    };
  }
}
