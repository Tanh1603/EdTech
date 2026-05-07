import { Injectable } from '@nestjs/common';
import { PageDto } from '../../../common/dto/page.dto';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Prisma, RoadmapStatus } from '../../../generated/prisma/client';
import { CreateRoadmapItemDto } from './dto/create-roadmap-item.dto';
import { CreateRoadmapDto } from './dto/create-roadmap.dto';
import { GenerateRoadmapDto } from './dto/generate-roadmap.dto';
import { RoadmapQueryDto } from './dto/roadmap-query.dto';
import { UpdateRoadmapItemDto } from './dto/update-roadmap-item.dto';
import { UpdateRoadmapDto } from './dto/update-roadmap.dto';

@Injectable()
export class RoadmapsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateRoadmap(payload: GenerateRoadmapDto, userId: string) {
    const roadmap = await this.prisma.learningRoadmap.create({
      data: {
        userId,
        title: payload.targetGoal,
        targetGoal: payload.targetGoal,
        status: RoadmapStatus.active,
        generatedByAi: true,
      },
    });

    const job = await this.prisma.job.create({
      data: {
        type: 'ai_roadmap_generation',
        status: 'queued',
        payload: {
          roadmapId: roadmap.id,
          userId,
          classId: payload.classId,
          weakTopics: payload.weakTopics ?? [],
        },
      },
    });

    return {
      roadmapId: roadmap.id,
      generatedByAi: true,
      status: 'generating',
      jobId: job.id,
    };
  }

  async createRoadmap(payload: CreateRoadmapDto, userId: string) {
    return this.prisma.learningRoadmap.create({
      data: {
        userId,
        title: payload.title,
        targetGoal: payload.targetGoal,
        generatedByAi: false,
      },
    });
  }

  async getRoadmaps(
    query: RoadmapQueryDto,
    userId: string,
  ): Promise<PageDto<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.LearningRoadmapWhereInput = {
      userId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.learningRoadmap.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.learningRoadmap.count({ where }),
    ]);

    return this.toPage(items, page, limit, total);
  }

  async getRoadmapDetail(roadmapId: string, userId: string) {
    return this.prisma.learningRoadmap.findFirstOrThrow({
      where: { id: roadmapId, userId },
      include: {
        items: { orderBy: { orderNo: 'asc' } },
      },
    });
  }

  async updateRoadmap(
    roadmapId: string,
    payload: UpdateRoadmapDto,
    userId: string,
  ) {
    await this.prisma.learningRoadmap.findFirstOrThrow({
      where: { id: roadmapId, userId },
      select: { id: true },
    });

    return this.prisma.learningRoadmap.update({
      where: { id: roadmapId },
      data: payload,
    });
  }

  async deleteRoadmap(roadmapId: string, userId: string) {
    await this.prisma.learningRoadmap.findFirstOrThrow({
      where: { id: roadmapId, userId },
      select: { id: true },
    });

    await this.prisma.$transaction([
      this.prisma.roadmapItem.deleteMany({ where: { roadmapId } }),
      this.prisma.learningRoadmap.delete({ where: { id: roadmapId } }),
    ]);

    return { id: roadmapId, deleted: true };
  }

  async createRoadmapItem(
    roadmapId: string,
    payload: CreateRoadmapItemDto,
    userId: string,
  ) {
    await this.prisma.learningRoadmap.findFirstOrThrow({
      where: { id: roadmapId, userId },
      select: { id: true },
    });

    return this.prisma.roadmapItem.create({
      data: { roadmapId, ...payload },
    });
  }

  async updateRoadmapItem(itemId: string, payload: UpdateRoadmapItemDto) {
    return this.prisma.roadmapItem.update({
      where: { id: itemId },
      data: payload,
    });
  }

  async deleteRoadmapItem(itemId: string) {
    await this.prisma.roadmapItem.delete({ where: { id: itemId } });
    return { id: itemId, deleted: true };
  }

  async completeRoadmapItem(itemId: string) {
    return this.prisma.roadmapItem.update({
      where: { id: itemId },
      data: { isCompleted: true },
    });
  }

  async uncompleteRoadmapItem(itemId: string) {
    return this.prisma.roadmapItem.update({
      where: { id: itemId },
      data: { isCompleted: false },
    });
  }

  async getRoadmapProgress(roadmapId: string, userId: string) {
    await this.prisma.learningRoadmap.findFirstOrThrow({
      where: { id: roadmapId, userId },
      select: { id: true },
    });

    const [totalItems, completedItems] = await this.prisma.$transaction([
      this.prisma.roadmapItem.count({ where: { roadmapId } }),
      this.prisma.roadmapItem.count({
        where: { roadmapId, isCompleted: true },
      }),
    ]);

    return {
      totalItems,
      completedItems,
      progressPercent:
        totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100),
    };
  }

  async getNextRoadmapItem(userId: string) {
    const item = await this.prisma.roadmapItem.findFirst({
      where: {
        isCompleted: false,
        roadmap: { userId, status: RoadmapStatus.active },
      },
      orderBy: { orderNo: 'asc' },
    });

    if (!item) {
      return null;
    }

    return {
      itemId: item.id,
      title: item.title,
    };
  }

  private toPage<T>(
    items: T[],
    page: number,
    limit: number,
    total: number,
  ): PageDto<T> {
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
}
