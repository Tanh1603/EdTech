import { Body, Controller, Delete, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { lastValueFrom } from 'rxjs';
import { DeleteFileDto } from '@edtech/contracts';
import { GrpcMetadataBuilder } from '../common/grpc-metadata/grpc-metadata.builder';
import { unwrapObjectResponse } from '@edtech/contracts';
import { RequestWithContext } from '../common/types/request-with-context';
import { BeCoreGrpcClientService } from '../grpc-clients/be-core-grpc-client.service';
import { GatewayStorageService } from './gateway-storage.service';

@ApiTags('Storage')
@ApiBearerAuth()
@Controller('storage')
export class StorageGatewayController {
  constructor(
    private readonly storage: GatewayStorageService,
    private readonly grpc: BeCoreGrpcClientService,
    private readonly metadata: GrpcMetadataBuilder,
  ) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload file to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 1024 * 1024 * 100 } }))
  uploadFile(@UploadedFile() file: any) {
    try {
      return this.storage.uploadFile(file);

    } catch (error) {
      console.log(error);

      return error
    }
  }

  @Delete('delete')
  @ApiOperation({ summary: 'Delete file from Cloudinary' })
  @ApiBody({ type: DeleteFileDto })
  async deleteFile(@Body() body: DeleteFileDto, @Req() req: RequestWithContext) {
    return unwrapObjectResponse(
      await lastValueFrom(
        this.grpc.storage.deleteFile(
          { publicId: body.publicId },
          this.metadata.build(req),
        ),
      ),
    );
  }
}
