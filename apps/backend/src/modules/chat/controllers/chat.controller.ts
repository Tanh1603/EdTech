import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CreateChatMessageDto } from '../dto/create-chat-message.dto';
import { CreateChatSessionDto } from '../dto/create-chat-session.dto';
import { ChatService } from '../services/chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('sessions')
  getSessions(@Query() query: PaginationQueryDto) {
    return this.chatService.getSessions(query.page ?? 1, query.limit ?? 20);
  }

  @Post('sessions')
  createSession(@Headers('x-user-id') userId: string | undefined, @Body() payload: CreateChatSessionDto) {
    return this.chatService.createSession(userId, payload);
  }

  @Get('sessions/:sessionId/messages')
  getMessages(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.chatService.getMessages(sessionId, query.page ?? 1, query.limit ?? 20);
  }

  @Post('sessions/:sessionId/messages')
  sendMessage(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() payload: CreateChatMessageDto,
  ) {
    return this.chatService.sendMessage(sessionId, payload);
  }

  @Post('sessions/:sessionId/memory/reset')
  resetMemory(@Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.chatService.resetMemory(sessionId);
  }
}

