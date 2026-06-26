import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { v2 as Cloudinary, UploadApiResponse } from 'cloudinary';
import { PrismaService } from '../../common/prisma/prisma.service';
const streamifier = require('streamifier');

type FileAccessInput = {
  materialId?: string;
  publicId?: string;
};

type FileMetadata = {
  publicId: string;
  storageUrl?: string | null;
  mimeType?: string | null;
  title?: string | null;
};

@Injectable()
export class StorageService {
  constructor(
    @Inject('CLOUDINARY')
    private readonly cloudinary: typeof Cloudinary,
    private readonly prisma: PrismaService,
  ) { }

  async uploadFile(
    file: Express.Multer.File,
    folder = 'edtech-ai',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: this.getUploadResourceType(file.mimetype),
          },
          (error, result) => {
            if (error || !result) {
              return reject(error);
            }

            resolve(result);
          },
        )
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async uploadFiles(
    files: Express.Multer.File[],
    folder = 'edtech-ai',
  ): Promise<UploadApiResponse[]> {
    return Promise.all(
      files.map((file) => this.uploadFile(file, folder)),
    );
  }

  async deleteFile(publicId: string) {
    if (!publicId) return;
    return this.cloudinary.uploader.destroy(publicId);
  }

  async deleteFiles(publicIds: string[]) {
    return Promise.all(publicIds.map(id => this.deleteFile(id)));
  }

  async resolveFileAccess(input: FileAccessInput) {
    const metadata = await this.resolveFileMetadata(input);
    const parsed = this.parseCloudinaryUrl(metadata.storageUrl);
    const extension = this.getExtension(metadata.mimeType, metadata.storageUrl, metadata.publicId);
    const resourceType = this.getDeliveryResourceType(metadata.mimeType, parsed.resourceType);
    
    const publicId = resourceType === 'raw'
      ? metadata.publicId
      : metadata.publicId.replace(new RegExp(`\\.${extension}$`, 'i'), '');

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const downloadUrl = this.cloudinary.utils.private_download_url(
      publicId,
      resourceType === 'raw' ? '' : extension,
      {
        resource_type: resourceType,
        type: parsed.deliveryType,
        expires_at: Math.floor(expiresAt.getTime() / 1000),
      },
    );

    return {
      downloadUrl,
      mimeType: metadata.mimeType ?? '',
      filename: this.filename(metadata, extension),
      expiresAt: expiresAt.toISOString(),
    };
  }


  private async resolveFileMetadata(input: FileAccessInput): Promise<FileMetadata> {
    if (input.materialId) {
      const material = await this.prisma.material.findUnique({
        where: { id: input.materialId },
        select: {
          publicId: true,
          storageUrl: true,
          mimeType: true,
          title: true,
        },
      });
      if (!material) {
        throw new NotFoundException(`Material not found: ${input.materialId}`);
      }
      if (!material.publicId) {
        throw new BadRequestException(`Material has no Cloudinary publicId: ${input.materialId}`);
      }
      return {
        publicId: material.publicId,
        storageUrl: material.storageUrl,
        mimeType: material.mimeType,
        title: material.title,
      };
    }

    if (!input.publicId) {
      throw new BadRequestException('ResolveFileAccess requires materialId or publicId');
    }
    return { publicId: input.publicId };
  }

  private parseCloudinaryUrl(storageUrl?: string | null) {
    const match = storageUrl?.match(/\/(image|video|raw)\/(upload|authenticated|private)\//);
    const versionMatch = storageUrl?.match(/\/v(\d+)\//);
    return {
      resourceType: match?.[1] ?? 'raw',
      deliveryType: match?.[2] ?? 'upload',
      version: versionMatch?.[1] ?? undefined,
    };
  }

  private getUploadResourceType(mimeType?: string): 'auto' | 'raw' {
    if (!mimeType) {
      return 'auto';
    }
    if (
      mimeType === 'application/pdf' ||
      mimeType.startsWith('text/') ||
      mimeType.includes('wordprocessingml') ||
      mimeType.includes('presentationml')
    ) {
      return 'raw';
    }
    return 'auto';
  }

  private getDeliveryResourceType(mimeType: string | null | undefined, fallback: string): string {
    if (fallback === 'image' || fallback === 'video') {
      return fallback;
    }
    if (
      mimeType === 'application/pdf' ||
      mimeType?.startsWith('text/') ||
      mimeType?.includes('wordprocessingml') ||
      mimeType?.includes('presentationml')
    ) {
      return 'raw';
    }
    return fallback;
  }


  private getExtension(
    mimeType?: string | null,
    storageUrl?: string | null,
    publicId?: string | null,
  ): string {
    const fromUrl = storageUrl?.split('?')[0]?.match(/\.([a-zA-Z0-9]+)$/)?.[1];
    const fromPublicId = publicId?.match(/\.([a-zA-Z0-9]+)$/)?.[1];
    return (fromUrl || fromPublicId || this.extensionForMimeType(mimeType)).toLowerCase();
  }

  private extensionForMimeType(mimeType?: string | null): string {
    if (!mimeType) {
      return '';
    }
    if (mimeType === 'application/pdf') {
      return 'pdf';
    }
    if (mimeType.includes('wordprocessingml')) {
      return 'docx';
    }
    if (mimeType.includes('presentationml')) {
      return 'pptx';
    }
    if (mimeType.startsWith('text/')) {
      return 'txt';
    }
    return '';
  }

  private publicIdForResourceType(publicId: string, resourceType: string, extension: string): string {
    if (resourceType !== 'raw' || this.publicIdHasExtension(publicId) || !extension) {
      return publicId;
    }
    return `${publicId}.${extension}`;
  }

  private publicIdHasExtension(publicId: string): boolean {
    return /\.[a-zA-Z0-9]+$/.test(publicId);
  }

  private filename(metadata: FileMetadata, extension: string): string {
    const base = metadata.title?.trim() || metadata.publicId.split('/').pop() || metadata.publicId;
    if (!extension || base.toLowerCase().endsWith(`.${extension}`)) {
      return base;
    }
    return `${base}.${extension}`;
  }
}
