import { Inject, Injectable } from '@nestjs/common';
import { v2 as Cloudinary, UploadApiResponse } from 'cloudinary';
import * as path from 'path';

const streamifier = require('streamifier');

@Injectable()
export class GatewayStorageService {
  constructor(
    @Inject('CLOUDINARY')
    private readonly cloudinary: typeof Cloudinary,
  ) {}

  uploadFile(file: any, folder = 'edtech-ai'): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const originalName = file.originalname || 'file';
      const ext = path.extname(originalName);
      const baseName = path.basename(originalName, ext);
      let cleanBaseName = baseName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_]/g, '_');

      if (!cleanBaseName.replace(/_/g, '')) {
        cleanBaseName = 'file';
      }
      const uniquePublicId = `${folder}/${cleanBaseName}_${Date.now()}${ext}`;

      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          public_id: uniquePublicId,
          resource_type: this.getUploadResourceType(file.mimetype),
        },
        (error, result) => {
          if (error || !result) {
            reject(error);
            return;
          }
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
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
}
