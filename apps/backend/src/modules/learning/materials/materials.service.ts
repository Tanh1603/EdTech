import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { PageDto, toIsoString, UserRole } from '@edtech/contracts';
import { PaginationQueryDto } from '@edtech/contracts';
import { AccessPolicyService } from '../../../common/access/access-policy.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { toUserSummary, userSummarySelect } from '../../../common/rbac/rbac.mapper';
import { MaterialStatus, Prisma } from '../../../generated/prisma/client';
import { StorageService } from '../../storage/storage.service';
import { MaterialQueryDto } from '@edtech/contracts';
import { UpdateMaterialDto } from '@edtech/contracts';
import { JobStatuses, JobTypes } from '@edtech/contracts';
import { JobsService } from '../../jobs/jobs.service';

@Injectable()
export class MaterialsService {
  private readonly logger = new Logger(MaterialsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly jobsService: JobsService,
    private readonly accessPolicy: AccessPolicyService,
  ) {}

  async uploadMaterial(
    file: Express.Multer.File,
    payload: { lessonId: string; title: string },
    createdBy: string,
  ) {
    const uploaded = await this.storageService.uploadFile(
      file,
      'edtech/materials',
    );

    const material = await this.prisma.material.create({
      data: {
        lessonId: payload.lessonId,
        title: payload.title,
        storageUrl: uploaded.secure_url,
        publicId: uploaded.public_id,
        mimeType: file.mimetype,
        size: file.size,
        status: MaterialStatus.uploaded,
        createdBy,
      },
      include: { creator: { select: userSummarySelect } },
    });

    await this.enqueueMaterialIngestJob(material, createdBy);

    return this.toMaterialResponse(material);
  }

  async createMaterial(
    payload: {
      lessonId: string;
      title: string;
      storageUrl: string;
      publicId?: string;
      mimeType?: string;
      size?: number;
    },
    createdBy: string,
    roles: UserRole[] = [],
  ) {
    await this.accessPolicy.assertLessonMaterialManageAccess(
      payload.lessonId,
      createdBy,
      roles,
    );

    const material = await this.prisma.material.create({
      data: {
        lessonId: payload.lessonId,
        title: payload.title,
        storageUrl: payload.storageUrl,
        publicId: payload.publicId,
        mimeType: payload.mimeType,
        size: payload.size,
        status: MaterialStatus.uploaded,
        createdBy,
      },
      include: { creator: { select: userSummarySelect } },
    });

    await this.enqueueMaterialIngestJob(material, createdBy);

    return this.toMaterialResponse(material);
  }

  async getMaterials(
    query: MaterialQueryDto,
    userId: string,
    roles: UserRole[] = [],
  ): Promise<PageDto<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.MaterialWhereInput = {
      AND: [
        {
          ...(query.lessonId ? { lessonId: query.lessonId } : {}),
          ...(query.status ? { status: query.status } : {}),
          ...(query.search
            ? { title: { contains: query.search, mode: 'insensitive' } }
            : {}),
        },
        this.accessPolicy.materialReadWhere(userId, roles),
      ],
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.material.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { creator: { select: userSummarySelect } },
      }),
      this.prisma.material.count({ where }),
    ]);

    return this.toPage(
      items.map((item) => this.toMaterialResponse(item)),
      page,
      limit,
      total,
    );
  }

  async getMaterialDetail(
    materialId: string,
    userId: string,
    roles: UserRole[] = [],
  ) {
    await this.accessPolicy.assertMaterialReadAccess(materialId, userId, roles);

    const material = await this.prisma.material.findUniqueOrThrow({
      where: { id: materialId },
      include: {
        creator: { select: userSummarySelect },
        _count: {
          select: { chunks: true },
        },
      },
    });

    const { _count, ...rest } = material;
    return {
      ...this.toMaterialResponse(rest),
      chunksCount: _count.chunks,
    };
  }

  async updateMaterial(
    materialId: string,
    payload: UpdateMaterialDto,
    userId: string,
    roles: UserRole[] = [],
  ) {
    await this.accessPolicy.assertMaterialManageAccess(materialId, userId, roles);

    const material = await this.prisma.material.update({
      where: { id: materialId },
      data: { title: payload.title },
      include: { creator: { select: userSummarySelect } },
    });

    return this.toMaterialResponse(material);
  }

  async replaceMaterialChunks(
    materialId: string,
    chunks: Array<{
      chunkId?: string;
      content: string;
      preview?: string;
      orderNo: number;
      tokenCount?: number;
      embeddingId?: string;
      storageKey?: string;
      pageNo?: number;
      source?: Prisma.InputJsonValue;
      checksum?: string;
    }>,
  ) {
    await this.prisma.material.findUniqueOrThrow({ where: { id: materialId } });

    const normalized = chunks
      .map((chunk, index) => ({
        materialId,
        content: chunk.preview || chunk.content.slice(0, 500),
        preview: chunk.preview || chunk.content.slice(0, 500),
        orderNo: chunk.orderNo || index + 1,
        tokenCount: chunk.tokenCount || null,
        embeddingId: chunk.embeddingId || chunk.chunkId || null,
        storageKey: chunk.storageKey || null,
        pageNo: chunk.pageNo || null,
        source: chunk.source || Prisma.JsonNull,
        checksum: chunk.checksum || null,
      }))
      .sort((left, right) => left.orderNo - right.orderNo);

    const { count, material } = await this.prisma.$transaction(async (tx) => {
      await tx.materialChunk.deleteMany({ where: { materialId } });
      const createResult = normalized.length
        ? await tx.materialChunk.createMany({ data: normalized })
        : { count: 0 };
      const material = await tx.material.findUniqueOrThrow({
        where: { id: materialId },
        include: { creator: { select: userSummarySelect } },
      });
      return { count: createResult.count, material };
    });

    return {
      ...this.toMaterialResponse(material),
      chunksCount: count,
    };
  }

  async clearMaterialChunks(materialId: string) {
    const material = await this.prisma.material.findUniqueOrThrow({
      where: { id: materialId },
      include: { creator: { select: userSummarySelect } },
    });
    const result = await this.prisma.materialChunk.deleteMany({ where: { materialId } });
    this.logger.log({
      type: 'MATERIAL_CHUNKS_CLEARED',
      materialId,
      deletedCount: result.count,
    });
    return {
      ...this.toMaterialResponse(material),
      chunksCount: 0,
      deletedCount: result.count,
    };
  }

  async appendMaterialChunks(
    materialId: string,
    chunks: Array<{
      chunkId?: string;
      content: string;
      preview?: string;
      orderNo: number;
      tokenCount?: number;
      embeddingId?: string;
      storageKey?: string;
      pageNo?: number;
      source?: Prisma.InputJsonValue;
      checksum?: string;
    }>,
  ) {
    const material = await this.prisma.material.findUniqueOrThrow({
      where: { id: materialId },
      include: { creator: { select: userSummarySelect } },
    });
    const normalized = chunks
      .map((chunk, index) => ({
        materialId,
        content: chunk.preview || chunk.content.slice(0, 500),
        preview: chunk.preview || chunk.content.slice(0, 500),
        orderNo: chunk.orderNo || index + 1,
        tokenCount: chunk.tokenCount || null,
        embeddingId: chunk.embeddingId || chunk.chunkId || null,
        storageKey: chunk.storageKey || null,
        pageNo: chunk.pageNo || null,
        source: chunk.source || Prisma.JsonNull,
        checksum: chunk.checksum || null,
      }))
      .sort((left, right) => left.orderNo - right.orderNo);
    const createResult = normalized.length
      ? await this.prisma.materialChunk.createMany({ data: normalized })
      : { count: 0 };
    const totalCount = await this.prisma.materialChunk.count({ where: { materialId } });
    this.logger.log({
      type: 'MATERIAL_CHUNKS_APPENDED',
      materialId,
      appendedCount: createResult.count,
      totalCount,
    });
    return {
      ...this.toMaterialResponse(material),
      chunksCount: totalCount,
      appendedCount: createResult.count,
    };
  }

  async updateMaterialStatus(
    materialId: string,
    status: string,
    error?: unknown,
  ) {
    if (!Object.values(MaterialStatus).includes(status as MaterialStatus)) {
      throw new BadRequestException(`Invalid material status: ${status}`);
    }

    const material = await this.prisma.material.update({
      where: { id: materialId },
      data: { status: status as MaterialStatus },
      include: { creator: { select: userSummarySelect } },
    });

    return {
      ...this.toMaterialResponse(material),
      error: error ?? null,
    };
  }

  async deleteMaterial(
    materialId: string,
    userId?: string,
    roles: UserRole[] = [],
  ) {
    if (userId) {
      await this.accessPolicy.assertMaterialManageAccess(materialId, userId, roles);
    }

    const material = await this.prisma.material.findUniqueOrThrow({
      where: { id: materialId },
      select: { id: true, publicId: true },
    });

    await this.prisma.$transaction([
      this.prisma.materialChunk.deleteMany({ where: { materialId } }),
      this.prisma.material.delete({ where: { id: materialId } }),
    ]);

    if (material.publicId) {
      await this.storageService.deleteFile(material.publicId);
    }

    return { id: materialId, deleted: true };
  }

  async getMaterialChunks(
    materialId: string,
    query: PaginationQueryDto,
    userId: string,
    roles: UserRole[] = [],
  ): Promise<PageDto<unknown>> {
    await this.accessPolicy.assertMaterialReadAccess(materialId, userId, roles);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.MaterialChunkWhereInput = { materialId };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.materialChunk.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { orderNo: 'asc' },
      }),
      this.prisma.materialChunk.count({ where }),
    ]);

    return this.toPage(items, page, limit, total);
  }

  async getChunkDetail(
    materialId: string,
    chunkId: string,
    userId: string,
    roles: UserRole[] = [],
  ) {
    await this.accessPolicy.assertMaterialReadAccess(materialId, userId, roles);

    return this.prisma.materialChunk.findFirstOrThrow({
      where: { id: chunkId, materialId },
    });
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

  private async enqueueMaterialIngestJob(
    material: {
      id: string;
      lessonId: string;
      title: string;
      storageUrl: string;
      publicId: string | null;
      mimeType: string | null;
      size: number | null;
    },
    createdBy: string,
  ) {
    const activeJob = await this.prisma.job.findFirst({
      where: {
        type: JobTypes.aiMaterialIngest,
        resourceId: material.id,
        status: {
          in: [JobStatuses.queued, JobStatuses.running, JobStatuses.retrying],
        },
      },
      select: { id: true, status: true },
    });

    if (activeJob) {
      this.logger.log(
        `Skipping duplicate material ingest job materialId=${material.id} jobId=${activeJob.id} status=${activeJob.status}`,
      );
      return activeJob;
    }

    const job = await this.jobsService.enqueue({
      type: JobTypes.aiMaterialIngest,
      payload: {
        materialId: material.id,
        lessonId: material.lessonId,
        title: material.title,
        storageUrl: material.storageUrl,
        publicId: material.publicId,
        mimeType: material.mimeType,
        size: material.size,
        createdBy,
        requestedBy: createdBy,
      },
      createdBy,
      resourceType: 'material',
      resourceId: material.id,
    });

    this.logger.log(
      `Queued material ingest job materialId=${material.id} jobId=${job.jobId} mimeType=${material.mimeType ?? ''}`,
    );
    return job;
  }

  async enqueueMaterialSummaryJob(materialId: string, userId: string) {
    const activeJob = await this.prisma.job.findFirst({
      where: {
        type: JobTypes.aiMaterialSummarize,
        resourceId: materialId,
        status: {
          in: [JobStatuses.queued, JobStatuses.running, JobStatuses.retrying],
        },
      },
      select: { id: true, status: true },
    });

    if (activeJob) {
      this.logger.log(
        `Skipping duplicate material summary job materialId=${materialId} jobId=${activeJob.id} status=${activeJob.status}`,
      );
      return activeJob;
    }

    const job = await this.jobsService.enqueue({
      type: JobTypes.aiMaterialSummarize,
      payload: {
        materialId,
        userId,
      },
      createdBy: userId,
      resourceType: 'material',
      resourceId: materialId,
    });

    this.logger.log(
      `Queued material summary job materialId=${materialId} jobId=${job.jobId}`,
    );
    return job;
  }

  async updateMaterialSummary(materialId: string, summary: string) {
    const material = await this.prisma.material.update({
      where: { id: materialId },
      data: { summary },
      include: { creator: { select: userSummarySelect } },
    });

    return this.toMaterialResponse(material);
  }

  private toMaterialResponse(material: {
    id: string;
    lessonId: string;
    title: string;
    storageUrl: string;
    publicId: string | null;
    mimeType: string | null;
    size: number | null;
    status: string;
    summary?: string | null;
    createdBy: string;
    createdAt: Date;
    creator?: Parameters<typeof toUserSummary>[0];
  }) {
    return {
      id: material.id,
      lessonId: material.lessonId,
      title: material.title,
      storageUrl: material.storageUrl,
      publicId: material.publicId ?? '',
      mimeType: material.mimeType ?? '',
      size: material.size ?? 0,
      status: material.status,
      summary: material.summary ?? null,
      createdBy: material.createdBy,
      creator: toUserSummary(material.creator),
      createdAt: toIsoString(material.createdAt),
    };
  }
}
