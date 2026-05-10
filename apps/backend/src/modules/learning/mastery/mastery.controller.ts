import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserPayload } from '../../../common/types/current-user.type';
import { BulkUpsertMasteryDto } from '@edtech/contracts';
import { UpsertMasteryDto } from '@edtech/contracts';
import { MasteryService } from './mastery.service';

@ApiTags('Learning - Mastery')
@ApiBearerAuth()
@Controller('learning/mastery')
export class MasteryController {
  constructor(private readonly masteryService: MasteryService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current student mastery' })
  @ApiOkResponse({ description: 'Current student mastery returned' })
  getMyMastery(@CurrentUser() user: CurrentUserPayload) {
    return this.masteryService.getMyMastery(user.id);
  }

  @Get('classes/:classId')
  @ApiOperation({ summary: 'Get mastery by class' })
  @ApiParam({ name: 'classId', format: 'uuid' })
  @ApiOkResponse({ description: 'Class mastery returned successfully' })
  getMasteryByClass(@Param('classId', ParseUUIDPipe) classId: string) {
    return this.masteryService.getMasteryByClass(classId);
  }

  @Get('topics/:topic')
  @ApiOperation({ summary: 'Get mastery history by topic' })
  @ApiParam({ name: 'topic', example: 'Integral' })
  @ApiOkResponse({ description: 'Topic mastery returned successfully' })
  getMasteryByTopic(
    @Param('topic') topic: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.masteryService.getMasteryByTopic(topic, user.id);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get mastery analytics' })
  @ApiOkResponse({ description: 'Mastery analytics returned successfully' })
  getMasteryAnalytics(@CurrentUser() user: CurrentUserPayload) {
    return this.masteryService.getMasteryAnalytics(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Update mastery score' })
  @ApiBody({ type: UpsertMasteryDto })
  @ApiCreatedResponse({ description: 'Mastery score updated successfully' })
  upsertMastery(@Body() body: UpsertMasteryDto) {
    return this.masteryService.upsertMastery(body);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk update mastery scores' })
  @ApiBody({ type: BulkUpsertMasteryDto })
  @ApiCreatedResponse({ description: 'Mastery scores updated successfully' })
  bulkUpsertMastery(@Body() body: BulkUpsertMasteryDto) {
    return this.masteryService.bulkUpsertMastery(body);
  }

  @Get('risk-students')
  @ApiOperation({ summary: 'Get students at learning risk' })
  @ApiOkResponse({ description: 'Risk students returned successfully' })
  getRiskStudents() {
    return this.masteryService.getRiskStudents();
  }
}
