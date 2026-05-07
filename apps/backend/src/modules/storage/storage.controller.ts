import {
  Body,
  Controller,
  Delete,
  Post,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) { }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 1024 * 1024 * 100, // 100MB
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.storageService.uploadFile(file);
  }

  @Delete('delete')
  async deleteFile(
    @Body() data: { publicId: string },
  ) {
    console.log(data.publicId);

    return this.storageService.deleteFile(data.publicId);
  }
}
