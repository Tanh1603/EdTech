import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserPayload } from '../../../common/types/current-user.type';
import { ChatSharedService } from '../shared/chat-shared.service';
import { ChatSessionsQueryDto, CreateChatSessionDto, UpdateChatSessionDto } from '../shared/dto/chat.dto';

@ApiTags('Chat - Sessions')
@ApiBearerAuth()
@Controller('chat/sessions')
export class SessionsController {
  constructor(private readonly chatService: ChatSharedService) {}

  @Post()
  @ApiOperation({ summary: 'Create chat session' })
  @ApiBody({ type: CreateChatSessionDto })
  @ApiCreatedResponse({ description: 'Session created successfully' })
  createSession(@Body() body: CreateChatSessionDto, @CurrentUser() user: CurrentUserPayload) {
    return this.chatService.createSession(body, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get current user chat sessions' })
  @ApiQuery({ name: 'classId', required: false, format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiOkResponse({ description: 'Sessions returned successfully' })
  getSessions(@Query() query: ChatSessionsQueryDto, @CurrentUser() user: CurrentUserPayload) {
    return this.chatService.getSessions(query, user.id);
  }

  @Get(':sessionId')
  @ApiOperation({ summary: 'Get session detail' })
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  getSessionDetail(@Param('sessionId', ParseUUIDPipe) sessionId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.chatService.getSessionDetail(sessionId, user.id);
  }

  @Patch(':sessionId')
  @ApiOperation({ summary: 'Update session title' })
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  @ApiBody({ type: UpdateChatSessionDto })
  updateSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() body: UpdateChatSessionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.chatService.updateSession(sessionId, body, user.id);
  }

  @Delete(':sessionId')
  @ApiOperation({ summary: 'Delete chat session' })
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  deleteSession(@Param('sessionId', ParseUUIDPipe) sessionId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.chatService.deleteSession(sessionId, user.id);
  }
}
