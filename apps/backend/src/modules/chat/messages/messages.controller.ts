import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserPayload } from '../../../common/types/current-user.type';
import { ChatSharedService } from '../shared/chat-shared.service';
import { ChatMessagesQueryDto, SendMessageDto } from '@edtech/contracts';

@ApiTags('Chat - Messages')
@ApiBearerAuth()
@Controller('chat')
export class MessagesController {
  constructor(private readonly chatService: ChatSharedService) {}

  @Get('sessions/:sessionId/messages')
  @ApiOperation({ summary: 'Get chat messages' })
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'before', required: false, type: String })
  getMessages(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Query() query: ChatMessagesQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.chatService.getMessages(sessionId, query, user.id);
  }

  @Post('sessions/:sessionId/messages')
  @ApiOperation({ summary: 'Create chat message' })
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  @ApiBody({ type: SendMessageDto })
  createMessage(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() body: SendMessageDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.chatService.createMessage(sessionId, body, user.id);
  }

  @Get('messages/:messageId')
  @ApiOperation({ summary: 'Get message detail' })
  @ApiParam({ name: 'messageId', format: 'uuid' })
  @ApiOkResponse({ description: 'Message detail returned successfully' })
  getMessageDetail(@Param('messageId', ParseUUIDPipe) messageId: string) {
    return this.chatService.getMessageDetail(messageId);
  }

  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Delete message' })
  @ApiParam({ name: 'messageId', format: 'uuid' })
  deleteMessage(@Param('messageId', ParseUUIDPipe) messageId: string) {
    return this.chatService.deleteMessage(messageId);
  }
}
