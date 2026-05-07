import { Injectable } from '@nestjs/common';
import {
  JobStatus,
  JobType,
  MaterialStatus,
} from '../../../generated/prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { PlacementTestDto } from '../dto/placement-test.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';

@Injectable()
export class LearningService {
  constructor(private readonly prisma: PrismaService) {}

  async getDocuments(page: number, limit: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.material.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.material.count(),
    ]);
    return { items, page, limit, total };
  }

  async createDocument(payload: CreateDocumentDto) {
    const document = await this.prisma.material.create({
      data: {
        courseId: payload.courseId,
        title: payload.title,
        storageUrl: payload.fileUrl,
        status: MaterialStatus.uploaded,
      },
    });
    await this.prisma.job.create({
      data: {
        type: JobType.material_ingest,
        status: JobStatus.queued,
        payload: { documentId: document.id },
      },
    });
    return document;
  }

  async updateDocument(documentId: string, payload: UpdateDocumentDto) {
    const document = await this.prisma.material.update({
      where: { id: documentId },
      data: payload,
    });
    await this.prisma.job.create({
      data: {
        type: JobType.material_ingest,
        status: JobStatus.queued,
        payload: { documentId },
      },
    });
    return document;
  }

  async deleteDocument(documentId: string): Promise<void> {
    await this.prisma.material.delete({ where: { id: documentId } });
  }

  submitPlacementTest(payload: PlacementTestDto) {
    const score = Math.min(100, payload.answers.length * 10);
    const level =
      score > 70 ? 'advanced' : score > 40 ? 'intermediate' : 'beginner';
    return { level, score };
  }

  getRoadmap() {
    return { userId: null, milestones: [] };
  }

  getProgress() {
    return { completionPercent: 0, topWeaknesses: [], trend: 'flat' };
  }
}
