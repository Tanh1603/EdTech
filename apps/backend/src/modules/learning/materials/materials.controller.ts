import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CurrentUser as CurrentUserPayload } from '../../../common/types/current-user.type';
import { MaterialStatus } from '../../../generated/prisma/client';
import { MaterialQueryDto } from './dto/material-query.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { MaterialsService } from './materials.service';

@ApiTags('Learning - Materials')
@ApiBearerAuth()
@Controller('learning/materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @ApiOperation({ summary: 'Upload learning material' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'lessonId', 'title'],
      properties: {
        file: { type: 'string', format: 'binary' },
        lessonId: { type: 'string', format: 'uuid' },
        title: { type: 'string', example: 'Chapter 1 PDF' },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Material uploaded successfully' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 1024 * 1024 * 100 },
    }),
  )
  uploadMaterial(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { lessonId: string; title: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.materialsService.uploadMaterial(file, body, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get materials list' })
  @ApiQuery({ name: 'lessonId', required: false, format: 'uuid' })
  @ApiQuery({ name: 'status', required: false, enum: MaterialStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiOkResponse({ description: 'Materials returned successfully' })
  getMaterials(@Query() query: MaterialQueryDto) {
    return this.materialsService.getMaterials(query);
  }

  @Get(':materialId')
  @ApiOperation({ summary: 'Get material detail' })
  @ApiParam({ name: 'materialId', format: 'uuid' })
  @ApiOkResponse({ description: 'Material detail returned successfully' })
  getMaterialDetail(@Param('materialId', ParseUUIDPipe) materialId: string) {
    return this.materialsService.getMaterialDetail(materialId);
  }

  @Patch(':materialId')
  @ApiOperation({ summary: 'Update material metadata' })
  @ApiParam({ name: 'materialId', format: 'uuid' })
  @ApiBody({ type: UpdateMaterialDto })
  @ApiOkResponse({ description: 'Material updated successfully' })
  updateMaterial(
    @Param('materialId', ParseUUIDPipe) materialId: string,
    @Body() body: UpdateMaterialDto,
  ) {
    return this.materialsService.updateMaterial(materialId, body);
  }

  @Delete(':materialId')
  @ApiOperation({ summary: 'Delete material' })
  @ApiParam({ name: 'materialId', format: 'uuid' })
  @ApiOkResponse({ description: 'Material deleted successfully' })
  deleteMaterial(@Param('materialId', ParseUUIDPipe) materialId: string) {
    return this.materialsService.deleteMaterial(materialId);
  }

  @Get(':materialId/chunks')
  @ApiOperation({ summary: 'Get material chunks' })
  @ApiParam({ name: 'materialId', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Material chunks returned successfully' })
  getMaterialChunks(
    @Param('materialId', ParseUUIDPipe) materialId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.materialsService.getMaterialChunks(materialId, query);
  }

  @Get(':materialId/chunks/:chunkId')
  @ApiOperation({ summary: 'Get material chunk detail' })
  @ApiParam({ name: 'materialId', format: 'uuid' })
  @ApiParam({ name: 'chunkId', format: 'uuid' })
  @ApiOkResponse({ description: 'Material chunk detail returned successfully' })
  getChunkDetail(
    @Param('materialId', ParseUUIDPipe) materialId: string,
    @Param('chunkId', ParseUUIDPipe) chunkId: string,
  ) {
    return this.materialsService.getChunkDetail(materialId, chunkId);
  }
}
