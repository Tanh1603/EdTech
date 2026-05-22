import { Injectable } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { PageDto, toIsoString } from '@edtech/contracts';
import { PaginationQueryDto } from '@edtech/contracts';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { toUserSummary, userSummarySelect } from '../../../common/rbac/rbac.mapper';
import { MaterialStatus, Prisma } from '../../../generated/prisma/client';
import { StorageService } from '../../storage/storage.service';
import { MaterialQueryDto } from '@edtech/contracts';
import { UpdateMaterialDto } from '@edtech/contracts';
import { JobTypes } from '@edtech/contracts';
import { JobsService } from '../../jobs/jobs.service';

@Injectable()
export class MaterialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly jobsService: JobsService,
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
  ) {
    try {

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

      await this.jobsService.enqueue({
        type: JobTypes.aiMaterialIngest,
        payload: {
          materialId: material.id,
          lessonId: material.lessonId,
          storageUrl: material.storageUrl,
          mimeType: material.mimeType,
        },
        createdBy,
        resourceType: 'material',
        resourceId: material.id,
      });

      return this.toMaterialResponse(material);
    } catch (error) {
      console.log(error);

    }
  }

  async getMaterials(query: MaterialQueryDto): Promise<PageDto<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.MaterialWhereInput = {
      ...(query.lessonId ? { lessonId: query.lessonId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? { title: { contains: query.search, mode: 'insensitive' } }
        : {}),
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

  async getMaterialDetail(materialId: string) {
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

  async updateMaterial(materialId: string, payload: UpdateMaterialDto) {
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
      orderNo: number;
      tokenCount?: number;
      embeddingId?: string;
      checksum?: string;
    }>,
  ) {
    await this.prisma.material.findUniqueOrThrow({ where: { id: materialId } });

    const normalized = chunks
      .map((chunk, index) => ({
        materialId,
        content: chunk.content,
        orderNo: chunk.orderNo || index + 1,
        tokenCount: chunk.tokenCount || null,
        embeddingId: chunk.embeddingId || chunk.chunkId || null,
        checksum: chunk.checksum || null,
      }))
      .sort((left, right) => left.orderNo - right.orderNo);

    const { count, material } = await this.prisma.$transaction(async (tx) => {
      await tx.materialChunk.deleteMany({ where: { materialId } });
      const createResult = normalized.length
        ? await tx.materialChunk.createMany({ data: normalized })
        : { count: 0 };
      const material = await tx.material.update({
        where: { id: materialId },
        data: { status: MaterialStatus.ready },
        include: { creator: { select: userSummarySelect } },
      });
      return { count: createResult.count, material };
    });

    return {
      ...this.toMaterialResponse(material),
      chunksCount: count,
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

  async deleteMaterial(materialId: string) {
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
  ): Promise<PageDto<unknown>> {
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

  async getChunkDetail(materialId: string, chunkId: string) {
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

  private toMaterialResponse(material: {
    id: string;
    lessonId: string;
    title: string;
    storageUrl: string;
    publicId: string | null;
    mimeType: string | null;
    size: number | null;
    status: string;
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
      createdBy: material.createdBy,
      creator: toUserSummary(material.creator),
      createdAt: toIsoString(material.createdAt),
    };
  }
}
