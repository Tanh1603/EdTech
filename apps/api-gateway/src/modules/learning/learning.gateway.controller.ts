import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { lastValueFrom } from 'rxjs';
import { GrpcMetadataBuilder } from '../common/grpc-metadata/grpc-metadata.builder';
import { toProtoStruct, unwrapListResponse, unwrapObjectResponse, unwrapPageResponse } from '../common/grpc-json/grpc-json.mapper';
import { RequestWithContext } from '../common/types/request-with-context';
import { CoreGrpcClientService } from '../grpc-clients/core-grpc-client.service';

@ApiTags('Learning - Materials')
@ApiBearerAuth()
@Controller('learning/materials')
export class LearningMaterialsGatewayController {
  constructor(private readonly grpc: CoreGrpcClientService, private readonly metadata: GrpcMetadataBuilder) {}

  @Post()
  @ApiOperation({ summary: 'Create learning material metadata from uploaded file URL' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['lessonId', 'title', 'storageUrl'],
      properties: {
        lessonId: { type: 'string', format: 'uuid' },
        title: { type: 'string', example: 'Chapter 1 PDF' },
        storageUrl: { type: 'string', example: 'https://res.cloudinary.com/.../file.pdf' },
        publicId: { type: 'string', example: 'edtech/materials/file' },
        mimeType: { type: 'string', example: 'application/pdf' },
        size: { type: 'number', example: 102400 },
      },
    },
  })
  async createMaterial(@Body() body: any, @Req() req: RequestWithContext) {
    return unwrapObjectResponse(await lastValueFrom(this.grpc.learningMaterials.createMaterial({
      lessonId: body.lessonId,
      title: body.title,
      storageUrl: body.storageUrl,
      publicId: body.publicId,
      mimeType: body.mimeType,
      size: Number(body.size) || undefined,
    }, this.metadata.build(req))));
  }

  @Get()
  @ApiOperation({ summary: 'Get materials list' })
  @ApiQuery({ name: 'lessonId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  async getMaterials(@Query() query: any, @Req() req: RequestWithContext) {
    return unwrapPageResponse(await lastValueFrom(this.grpc.learningMaterials.getMaterials({
      lessonId: query.lessonId,
      status: query.status,
      page: Number(query.page) || undefined,
      limit: Number(query.limit) || undefined,
      search: query.search,
    }, this.metadata.build(req))));
  }

  @Get(':materialId')
  @ApiOperation({ summary: 'Get material detail' })
  getMaterialDetail(@Param('materialId') materialId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.learningMaterials.getMaterialDetail({ materialId }, this.metadata.build(req)));
  }

  @Patch(':materialId')
  @ApiOperation({ summary: 'Update material metadata' })
  @ApiBody({ schema: { type: 'object' } })
  updateMaterial(@Param('materialId') materialId: string, @Body() body: any, @Req() req: RequestWithContext) {
    return this.object(this.grpc.learningMaterials.updateMaterial({ materialId, body: toProtoStruct(body) }, this.metadata.build(req)));
  }

  @Delete(':materialId')
  @ApiOperation({ summary: 'Delete material' })
  deleteMaterial(@Param('materialId') materialId: string, @Req() req: RequestWithContext) {
    return lastValueFrom(this.grpc.learningMaterials.deleteMaterial({ materialId }, this.metadata.build(req)));
  }

  @Get(':materialId/chunks')
  @ApiOperation({ summary: 'Get material chunks' })
  async getMaterialChunks(@Param('materialId') materialId: string, @Query() query: any, @Req() req: RequestWithContext) {
    return unwrapPageResponse(await lastValueFrom(this.grpc.learningMaterials.getMaterialChunks({
      materialId,
      page: Number(query.page) || undefined,
      limit: Number(query.limit) || undefined,
    }, this.metadata.build(req))));
  }

  @Get(':materialId/chunks/:chunkId')
  @ApiOperation({ summary: 'Get material chunk detail' })
  getChunkDetail(@Param('materialId') materialId: string, @Param('chunkId') chunkId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.learningMaterials.getChunkDetail({ materialId, chunkId }, this.metadata.build(req)));
  }

  private async object(call: any) {
    return unwrapObjectResponse(await lastValueFrom(call));
  }
}

@ApiTags('Learning - Roadmaps')
@ApiBearerAuth()
@Controller('learning/roadmaps')
export class LearningRoadmapsGatewayController {
  constructor(private readonly grpc: CoreGrpcClientService, private readonly metadata: GrpcMetadataBuilder) {}

  @Post()
  @ApiOperation({ summary: 'Create manual roadmap' })
  @ApiBody({ schema: { type: 'object' } })
  createRoadmap(@Body() body: any, @Req() req: RequestWithContext) {
    return this.object(this.grpc.learningRoadmaps.createRoadmap({ body: toProtoStruct(body) }, this.metadata.build(req)));
  }

  @Get()
  @ApiOperation({ summary: 'Get current user roadmaps' })
  async getRoadmaps(@Query() query: any, @Req() req: RequestWithContext) {
    return unwrapPageResponse(await lastValueFrom(this.grpc.learningRoadmaps.getRoadmaps({
      status: query.status,
      page: Number(query.page) || undefined,
      limit: Number(query.limit) || undefined,
    }, this.metadata.build(req))));
  }

  @Get('next')
  @ApiOperation({ summary: 'Get next roadmap item' })
  getNextRoadmapItem(@Req() req: RequestWithContext) {
    return this.object(this.grpc.learningRoadmaps.getNextRoadmapItem({}, this.metadata.build(req)));
  }

  @Get(':roadmapId')
  @ApiOperation({ summary: 'Get roadmap detail' })
  getRoadmapDetail(@Param('roadmapId') roadmapId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.learningRoadmaps.getRoadmapDetail({ roadmapId }, this.metadata.build(req)));
  }

  @Patch(':roadmapId')
  @ApiOperation({ summary: 'Update roadmap' })
  @ApiBody({ schema: { type: 'object' } })
  updateRoadmap(@Param('roadmapId') roadmapId: string, @Body() body: any, @Req() req: RequestWithContext) {
    return this.object(this.grpc.learningRoadmaps.updateRoadmap({ roadmapId, body: toProtoStruct(body) }, this.metadata.build(req)));
  }

  @Delete(':roadmapId')
  @ApiOperation({ summary: 'Delete roadmap' })
  deleteRoadmap(@Param('roadmapId') roadmapId: string, @Req() req: RequestWithContext) {
    return lastValueFrom(this.grpc.learningRoadmaps.deleteRoadmap({ roadmapId }, this.metadata.build(req)));
  }

  @Post(':roadmapId/items')
  @ApiOperation({ summary: 'Create roadmap item' })
  @ApiBody({ schema: { type: 'object' } })
  createRoadmapItem(@Param('roadmapId') roadmapId: string, @Body() body: any, @Req() req: RequestWithContext) {
    return this.object(this.grpc.learningRoadmaps.createRoadmapItem({ roadmapId, body: toProtoStruct(body) }, this.metadata.build(req)));
  }

  @Get(':roadmapId/progress')
  @ApiOperation({ summary: 'Get roadmap progress summary' })
  getRoadmapProgress(@Param('roadmapId') roadmapId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.learningRoadmaps.getRoadmapProgress({ roadmapId }, this.metadata.build(req)));
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update roadmap item' })
  @ApiBody({ schema: { type: 'object' } })
  updateRoadmapItem(@Param('itemId') itemId: string, @Body() body: any, @Req() req: RequestWithContext) {
    return this.object(this.grpc.learningRoadmaps.updateRoadmapItem({ itemId, body: toProtoStruct(body) }, this.metadata.build(req)));
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Delete roadmap item' })
  deleteRoadmapItem(@Param('itemId') itemId: string, @Req() req: RequestWithContext) {
    return lastValueFrom(this.grpc.learningRoadmaps.deleteRoadmapItem({ itemId }, this.metadata.build(req)));
  }

  @Post('items/:itemId/complete')
  @ApiOperation({ summary: 'Mark roadmap item completed' })
  completeRoadmapItem(@Param('itemId') itemId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.learningRoadmaps.completeRoadmapItem({ itemId }, this.metadata.build(req)));
  }

  @Post('items/:itemId/uncomplete')
  @ApiOperation({ summary: 'Mark roadmap item incomplete' })
  uncompleteRoadmapItem(@Param('itemId') itemId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.learningRoadmaps.uncompleteRoadmapItem({ itemId }, this.metadata.build(req)));
  }

  private async object(call: any) {
    return unwrapObjectResponse(await lastValueFrom(call));
  }
}

@ApiTags('Learning - Mastery')
@ApiBearerAuth()
@Controller('learning/mastery')
export class LearningMasteryGatewayController {
  constructor(private readonly grpc: CoreGrpcClientService, private readonly metadata: GrpcMetadataBuilder) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current student mastery' })
  async getMyMastery(@Req() req: RequestWithContext) {
    return unwrapListResponse(await lastValueFrom(this.grpc.learningMastery.getMyMastery({}, this.metadata.build(req)))).items;
  }

  @Get('classes/:classId')
  @ApiOperation({ summary: 'Get mastery by class' })
  async getMasteryByClass(@Param('classId') classId: string, @Req() req: RequestWithContext) {
    return unwrapListResponse(await lastValueFrom(this.grpc.learningMastery.getMasteryByClass({ classId }, this.metadata.build(req)))).items;
  }

  @Get('topics/:topic')
  @ApiOperation({ summary: 'Get mastery history by topic' })
  async getMasteryByTopic(@Param('topic') topic: string, @Req() req: RequestWithContext) {
    return unwrapListResponse(await lastValueFrom(this.grpc.learningMastery.getMasteryByTopic({ topic }, this.metadata.build(req)))).items;
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get mastery analytics' })
  getMasteryAnalytics(@Req() req: RequestWithContext) {
    return this.object(this.grpc.learningMastery.getMasteryAnalytics({}, this.metadata.build(req)));
  }

  @Post()
  @ApiOperation({ summary: 'Update mastery score' })
  @ApiBody({ schema: { type: 'object' } })
  upsertMastery(@Body() body: any, @Req() req: RequestWithContext) {
    return this.object(this.grpc.learningMastery.upsertMastery({ body: toProtoStruct(body) }, this.metadata.build(req)));
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk update mastery scores' })
  @ApiBody({ schema: { type: 'object' } })
  bulkUpsertMastery(@Body() body: any, @Req() req: RequestWithContext) {
    return this.object(this.grpc.learningMastery.bulkUpsertMastery({ body: toProtoStruct(body) }, this.metadata.build(req)));
  }

  @Get('risk-students')
  @ApiOperation({ summary: 'Get students at learning risk' })
  getRiskStudents(@Req() req: RequestWithContext) {
    return this.object(this.grpc.learningMastery.getRiskStudents({}, this.metadata.build(req)));
  }

  private async object(call: any) {
    return unwrapObjectResponse(await lastValueFrom(call));
  }
}
