import { Inject, Injectable } from '@nestjs/common';
import { v2 as Cloudinary, UploadApiResponse } from 'cloudinary';

const streamifier = require('streamifier');

@Injectable()
export class GatewayStorageService {
  constructor(
    @Inject('CLOUDINARY')
    private readonly cloudinary: typeof Cloudinary,
  ) {}

  uploadFile(file: any, folder = 'edtech-ai'): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        { folder, resource_type: this.getUploadResourceType(file.mimetype) },
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
