import { Injectable } from '@nestjs/common';
import { PageDto } from '../../../common/dto/page.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { MaterialStatus, Prisma } from '../../../generated/prisma/client';
import { StorageService } from '../../storage/storage.service';
import { MaterialQueryDto } from './dto/material-query.dto';
import { ReindexMaterialDto } from './dto/reindex-material.dto';
import { SearchMaterialsDto } from './dto/search-materials.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class MaterialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async uploadMaterial(
    file: Express.Multer.File,
    payload: { lessonId: string; title: string },
    createdBy: string,
  ) {
    const uploaded = await this.storageService.uploadFile(
      file,
      'edtech-ai/materials',
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

  async reindexMaterial(materialId: string, payload: ReindexMaterialDto) {
    await this.prisma.material.update({
      where: { id: materialId },
      data: { status: MaterialStatus.indexing },
    });

    const job = await this.prisma.job.create({
      data: {
        type: 'material_ingest',
        status: 'queued',
        payload: {
          materialId,
          force: payload.force ?? false,
          chunkSize: payload.chunkSize ?? 500,
          chunkOverlap: payload.chunkOverlap ?? 100,
        },
      },
    });

    return { materialId, status: MaterialStatus.indexing, jobId: job.id };
  }

  async getMaterialJobs(materialId: string) {
    return this.prisma.job.findMany({
      where: {
        type: {
          in: [
            'material_ingest',
            'material_chunking',
            'rag_embedding',
            'vector_index_sync',
          ],
        },
        payload: {
          path: ['materialId'],
          equals: materialId,
        } as any,
      },
      orderBy: { createdAt: 'desc' },
    });
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

  async searchMaterials(payload: SearchMaterialsDto) {
    const topK = payload.topK ?? 5;
    const chunks = await this.prisma.materialChunk.findMany({
      where: {
        content: { contains: payload.query, mode: 'insensitive' },
        ...(payload.lessonId
          ? { material: { lessonId: payload.lessonId } }
          : {}),
      },
      take: topK,
      orderBy: { createdAt: 'desc' },
    });

    return {
      matches: chunks.map((chunk) => ({
        chunkId: chunk.id,
        content: chunk.content,
        score: 1,
      })),
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
