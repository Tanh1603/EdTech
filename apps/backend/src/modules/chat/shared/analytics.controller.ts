import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserPayload } from '../../../common/types/current-user.type';
import { ChatSharedService } from './chat-shared.service';

@ApiTags('Chat - Analytics')
@ApiBearerAuth()
@Controller('chat/analytics')
export class ChatAnalyticsController {
  constructor(private readonly chatService: ChatSharedService) {}

  @Get('sessions/me')
  @ApiOperation({ summary: 'Get user chat analytics' })
  @ApiOkResponse({ description: 'User chat analytics returned successfully' })
  getMyAnalytics(@CurrentUser() user: CurrentUserPayload) {
    return this.chatService.getMyAnalytics(user.id);
  }

  @Get('classrooms/:classId')
  @ApiOperation({ summary: 'Get classroom AI usage analytics' })
  @ApiParam({ name: 'classId', format: 'uuid' })
  getClassroomAnalytics(
    @Param('classId', ParseUUIDPipe) classId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.chatService.getClassroomAnalytics(classId, user.id);
  }
}
