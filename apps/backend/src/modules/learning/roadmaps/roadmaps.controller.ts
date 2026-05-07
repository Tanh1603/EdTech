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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserPayload } from '../../../common/types/current-user.type';
import { RoadmapStatus } from '../../../generated/prisma/client';
import { CreateRoadmapItemDto } from './dto/create-roadmap-item.dto';
import { CreateRoadmapDto } from './dto/create-roadmap.dto';
import { GenerateRoadmapDto } from './dto/generate-roadmap.dto';
import { RoadmapQueryDto } from './dto/roadmap-query.dto';
import { UpdateRoadmapItemDto } from './dto/update-roadmap-item.dto';
import { UpdateRoadmapDto } from './dto/update-roadmap.dto';
import { RoadmapsService } from './roadmaps.service';

@ApiTags('Learning - Roadmaps')
@ApiBearerAuth()
@Controller('learning/roadmaps')
export class RoadmapsController {
  constructor(private readonly roadmapsService: RoadmapsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate AI roadmap' })
  @ApiBody({ type: GenerateRoadmapDto })
  @ApiCreatedResponse({ description: 'Roadmap generation job queued' })
  generateRoadmap(
    @Body() body: GenerateRoadmapDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.roadmapsService.generateRoadmap(body, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create manual roadmap' })
  @ApiBody({ type: CreateRoadmapDto })
  @ApiCreatedResponse({ description: 'Roadmap created successfully' })
  createRoadmap(
    @Body() body: CreateRoadmapDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.roadmapsService.createRoadmap(body, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get current user roadmaps' })
  @ApiQuery({ name: 'status', required: false, enum: RoadmapStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Roadmaps returned successfully' })
  getRoadmaps(
    @Query() query: RoadmapQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.roadmapsService.getRoadmaps(query, user.id);
  }

  @Get('next')
  @ApiOperation({ summary: 'Get next recommended roadmap item' })
  @ApiOkResponse({ description: 'Next roadmap item returned successfully' })
  getNextRoadmapItem(@CurrentUser() user: CurrentUserPayload) {
    return this.roadmapsService.getNextRoadmapItem(user.id);
  }

  @Get(':roadmapId')
  @ApiOperation({ summary: 'Get roadmap detail' })
  @ApiParam({ name: 'roadmapId', format: 'uuid' })
  @ApiOkResponse({ description: 'Roadmap detail returned successfully' })
  getRoadmapDetail(
    @Param('roadmapId', ParseUUIDPipe) roadmapId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.roadmapsService.getRoadmapDetail(roadmapId, user.id);
  }

  @Patch(':roadmapId')
  @ApiOperation({ summary: 'Update roadmap' })
  @ApiParam({ name: 'roadmapId', format: 'uuid' })
  @ApiBody({ type: UpdateRoadmapDto })
  @ApiOkResponse({ description: 'Roadmap updated successfully' })
  updateRoadmap(
    @Param('roadmapId', ParseUUIDPipe) roadmapId: string,
    @Body() body: UpdateRoadmapDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.roadmapsService.updateRoadmap(roadmapId, body, user.id);
  }

  @Delete(':roadmapId')
  @ApiOperation({ summary: 'Delete roadmap' })
  @ApiParam({ name: 'roadmapId', format: 'uuid' })
  @ApiOkResponse({ description: 'Roadmap deleted successfully' })
  deleteRoadmap(
    @Param('roadmapId', ParseUUIDPipe) roadmapId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.roadmapsService.deleteRoadmap(roadmapId, user.id);
  }

  @Post(':roadmapId/items')
  @ApiOperation({ summary: 'Create roadmap item' })
  @ApiParam({ name: 'roadmapId', format: 'uuid' })
  @ApiBody({ type: CreateRoadmapItemDto })
  @ApiCreatedResponse({ description: 'Roadmap item created successfully' })
  createRoadmapItem(
    @Param('roadmapId', ParseUUIDPipe) roadmapId: string,
    @Body() body: CreateRoadmapItemDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.roadmapsService.createRoadmapItem(roadmapId, body, user.id);
  }

  @Get(':roadmapId/progress')
  @ApiOperation({ summary: 'Get roadmap progress summary' })
  @ApiParam({ name: 'roadmapId', format: 'uuid' })
  @ApiOkResponse({ description: 'Roadmap progress returned successfully' })
  getRoadmapProgress(
    @Param('roadmapId', ParseUUIDPipe) roadmapId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.roadmapsService.getRoadmapProgress(roadmapId, user.id);
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update roadmap item' })
  @ApiParam({ name: 'itemId', format: 'uuid' })
  @ApiBody({ type: UpdateRoadmapItemDto })
  @ApiOkResponse({ description: 'Roadmap item updated successfully' })
  updateRoadmapItem(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() body: UpdateRoadmapItemDto,
  ) {
    return this.roadmapsService.updateRoadmapItem(itemId, body);
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Delete roadmap item' })
  @ApiParam({ name: 'itemId', format: 'uuid' })
  @ApiOkResponse({ description: 'Roadmap item deleted successfully' })
  deleteRoadmapItem(@Param('itemId', ParseUUIDPipe) itemId: string) {
    return this.roadmapsService.deleteRoadmapItem(itemId);
  }

  @Post('items/:itemId/complete')
  @ApiOperation({ summary: 'Mark roadmap item completed' })
  @ApiParam({ name: 'itemId', format: 'uuid' })
  @ApiOkResponse({ description: 'Roadmap item marked completed' })
  completeRoadmapItem(@Param('itemId', ParseUUIDPipe) itemId: string) {
    return this.roadmapsService.completeRoadmapItem(itemId);
  }

  @Post('items/:itemId/uncomplete')
  @ApiOperation({ summary: 'Mark roadmap item incomplete' })
  @ApiParam({ name: 'itemId', format: 'uuid' })
  @ApiOkResponse({ description: 'Roadmap item marked incomplete' })
  uncompleteRoadmapItem(@Param('itemId', ParseUUIDPipe) itemId: string) {
    return this.roadmapsService.uncompleteRoadmapItem(itemId);
  }
}
