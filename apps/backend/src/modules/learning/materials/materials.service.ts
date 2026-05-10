import { Injectable } from '@nestjs/common';
import { PageDto } from '@edtech/contracts';
import { PaginationQueryDto } from '@edtech/contracts';
import { PrismaService } from '../../../common/prisma/prisma.service';
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

    return this.prisma.material.create({
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
    });
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

    return material;
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
      }),
      this.prisma.material.count({ where }),
    ]);

    return this.toPage(items, page, limit, total);
  }

  async getMaterialDetail(materialId: string) {
    const material = await this.prisma.material.findUniqueOrThrow({
      where: { id: materialId },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
    });

    const { _count, ...rest } = material;
    return {
      ...rest,
      chunksCount: _count.chunks,
    };
  }

  async updateMaterial(materialId: string, payload: UpdateMaterialDto) {
    return this.prisma.material.update({
      where: { id: materialId },
      data: { title: payload.title },
    });
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
}
