import { Inject, Injectable } from '@nestjs/common';
import { v2 as Cloudinary, UploadApiResponse } from 'cloudinary';
const streamifier = require('streamifier');
@Injectable()
export class StorageService {
  constructor(
    @Inject('CLOUDINARY')
    private readonly cloudinary: typeof Cloudinary,
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
            resource_type: 'auto',
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
}
