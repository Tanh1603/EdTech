import {
  Body,
  Controller,
  Delete,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { DeleteFileDto } from './dto/delete-file.dto';
import { StorageService } from './storage.service';

@ApiTags('Storage')
@ApiBearerAuth()
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload file to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'File uploaded successfully' })
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
  @ApiOperation({ summary: 'Delete file from Cloudinary' })
  @ApiBody({ type: DeleteFileDto })
  @ApiOkResponse({ description: 'File deleted successfully' })
  async deleteFile(
    @Body() data: DeleteFileDto,
  ) {
    return this.storageService.deleteFile(data.publicId);
  }
}
