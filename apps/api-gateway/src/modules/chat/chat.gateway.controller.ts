import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { lastValueFrom } from 'rxjs';
import { ChatMessagesQueryDto, ChatSessionsQueryDto, CreateChatSessionDto, SendMessageDto, UpdateChatSessionDto } from '@edtech/contracts';
import { GrpcMetadataBuilder } from '../common/grpc-metadata/grpc-metadata.builder';
import { toProtoStruct, unwrapObjectResponse, unwrapPageResponse } from '@edtech/contracts';
import { RequestWithContext } from '../common/types/request-with-context';
import { CoreGrpcClientService } from '../grpc-clients/core-grpc-client.service';

@ApiTags('Chat - Sessions')
@ApiBearerAuth()
@Controller('chat/sessions')
export class ChatSessionsGatewayController {
  constructor(private readonly grpc: CoreGrpcClientService, private readonly metadata: GrpcMetadataBuilder) {}

  @Post()
  @ApiOperation({ summary: 'Create chat session' })
  @ApiBody({ schema: { type: 'object' } })
  createSession(@Body() body: CreateChatSessionDto, @Req() req: RequestWithContext) {
    return this.object(this.grpc.chatSessions.createSession({ body: toProtoStruct(body) }, this.metadata.build(req)));
  }

  @Get()
  @ApiOperation({ summary: 'Get current user chat sessions' })
  @ApiQuery({ name: 'classId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  async getSessions(@Query() query: ChatSessionsQueryDto, @Req() req: RequestWithContext) {
    return unwrapPageResponse(await lastValueFrom(this.grpc.chatSessions.getSessions({
      classId: query.classId,
      page: Number(query.page) || undefined,
      limit: Number(query.limit) || undefined,
      search: query.search,
    }, this.metadata.build(req))));
  }

  @Get(':sessionId')
  @ApiOperation({ summary: 'Get session detail' })
  getSessionDetail(@Param('sessionId') sessionId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.chatSessions.getSessionDetail({ sessionId }, this.metadata.build(req)));
  }

  @Patch(':sessionId')
  @ApiOperation({ summary: 'Update session title' })
  @ApiBody({ schema: { type: 'object' } })
  updateSession(@Param('sessionId') sessionId: string, @Body() body: UpdateChatSessionDto, @Req() req: RequestWithContext) {
    return this.object(this.grpc.chatSessions.updateSession({ sessionId, body: toProtoStruct(body) }, this.metadata.build(req)));
  }

  @Delete(':sessionId')
  @ApiOperation({ summary: 'Delete chat session' })
  deleteSession(@Param('sessionId') sessionId: string, @Req() req: RequestWithContext) {
    return lastValueFrom(this.grpc.chatSessions.deleteSession({ sessionId }, this.metadata.build(req)));
  }

  private async object(call: any) {
    return unwrapObjectResponse(await lastValueFrom(call));
  }
}

@ApiTags('Chat - Messages')
@ApiBearerAuth()
@Controller('chat')
export class ChatMessagesGatewayController {
  constructor(private readonly grpc: CoreGrpcClientService, private readonly metadata: GrpcMetadataBuilder) {}

  @Get('sessions/:sessionId/messages')
  @ApiOperation({ summary: 'Get chat messages' })
  async getMessages(@Param('sessionId') sessionId: string, @Query() query: ChatMessagesQueryDto, @Req() req: RequestWithContext) {
    return unwrapPageResponse(await lastValueFrom(this.grpc.chatMessages.getMessages({
      sessionId,
      page: Number(query.page) || undefined,
      limit: Number(query.limit) || undefined,
      before: query.before,
    }, this.metadata.build(req))));
  }

  @Post('sessions/:sessionId/messages')
  @ApiOperation({ summary: 'Create chat message' })
  @ApiBody({ schema: { type: 'object' } })
  createMessage(@Param('sessionId') sessionId: string, @Body() body: SendMessageDto, @Req() req: RequestWithContext) {
    return this.object(this.grpc.chatMessages.createMessage({ sessionId, body: toProtoStruct(body) }, this.metadata.build(req)));
  }

  @Get('messages/:messageId')
  @ApiOperation({ summary: 'Get message detail' })
  getMessageDetail(@Param('messageId') messageId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.chatMessages.getMessageDetail({ messageId }, this.metadata.build(req)));
  }

  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Delete message' })
  deleteMessage(@Param('messageId') messageId: string, @Req() req: RequestWithContext) {
    return lastValueFrom(this.grpc.chatMessages.deleteMessage({ messageId }, this.metadata.build(req)));
  }

  private async object(call: any) {
    return unwrapObjectResponse(await lastValueFrom(call));
  }
}

@ApiTags('Chat - Analytics')
@ApiBearerAuth()
@Controller('chat/analytics')
export class ChatAnalyticsGatewayController {
  constructor(private readonly grpc: CoreGrpcClientService, private readonly metadata: GrpcMetadataBuilder) {}

  @Get('sessions/me')
  @ApiOperation({ summary: 'Get user chat analytics' })
  getMyAnalytics(@Req() req: RequestWithContext) {
    return this.object(this.grpc.chatAnalytics.getMyAnalytics({}, this.metadata.build(req)));
  }

  @Get('classrooms/:classId')
  @ApiOperation({ summary: 'Get classroom AI usage analytics' })
  getClassroomAnalytics(@Param('classId') classId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.chatAnalytics.getClassroomAnalytics({ classId }, this.metadata.build(req)));
  }

  private async object(call: any) {
    return unwrapObjectResponse(await lastValueFrom(call));
  }
}
