import { Body, Controller, Delete, Get, Logger, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { lastValueFrom, Observable } from 'rxjs';
import {
  ChatMessagesQueryDto,
  ChatRealtimeEvents,
  ChatSessionsQueryDto,
  CreateChatSessionDto,
  SendMessageDto,
  UpdateChatSessionDto,
} from '@edtech/contracts';
import { GrpcMetadataBuilder } from '../common/grpc-metadata/grpc-metadata.builder';
import { toProtoStruct, unwrapObjectResponse, unwrapPageResponse } from '@edtech/contracts';
import { RequestWithContext } from '../common/types/request-with-context';
import { BeCoreGrpcClientService } from '../grpc-clients/be-core-grpc-client.service';
import { RealtimePublisher } from '../realtime/realtime.publisher';
import { RealtimeRooms } from '../realtime/realtime.rooms';

@ApiTags('Chat - Sessions')
@ApiBearerAuth()
@Controller('chat/sessions')
export class ChatSessionsGatewayController {
  private readonly logger = new Logger(ChatSessionsGatewayController.name);

  constructor(
    private readonly grpc: BeCoreGrpcClientService,
    private readonly metadata: GrpcMetadataBuilder,
    private readonly realtime: RealtimePublisher,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create chat session' })
  @ApiBody({ type: CreateChatSessionDto })
  async createSession(@Body() body: CreateChatSessionDto, @Req() req: RequestWithContext) {
    this.logger.log(
      `[${req.context?.requestId ?? req.requestId ?? 'unknown'}] controller.createSession start user=${this.getUserId(req)} title=${body.title ?? ''}`,
    );
    const result = await this.object(this.grpc.chatSessions.createSession({ body: toProtoStruct(body) }, this.metadata.build(req)));
    const context = this.getPublishContext(req);
    const sessionId = this.getStringField(result, 'id');

    this.logger.log(
      `[${context.requestId ?? 'unknown'}] controller.createSession grpc.ok sessionId=${sessionId ?? 'unknown'}`,
    );

    this.realtime.publishChatEvent(
      RealtimeRooms.user(this.getUserId(req)),
      ChatRealtimeEvents.sessionCreated,
      result,
      context,
    );
    if (body.classId) {
      this.realtime.publishChatEvent(
        RealtimeRooms.class(body.classId),
        ChatRealtimeEvents.sessionCreated,
        result,
        context,
      );
    }

    return result;
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
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  getSessionDetail(@Param('sessionId') sessionId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.chatSessions.getSessionDetail({ sessionId }, this.metadata.build(req)));
  }

  @Patch(':sessionId')
  @ApiOperation({ summary: 'Update session title' })
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  @ApiBody({ type: UpdateChatSessionDto })
  async updateSession(@Param('sessionId') sessionId: string, @Body() body: UpdateChatSessionDto, @Req() req: RequestWithContext) {
    const result = await this.object(this.grpc.chatSessions.updateSession({ sessionId, body: toProtoStruct(body) }, this.metadata.build(req)));
    this.realtime.publishChatEvent(
      RealtimeRooms.chatSession(sessionId),
      ChatRealtimeEvents.sessionUpdated,
      result,
      this.getPublishContext(req),
    );
    return result;
  }

  @Delete(':sessionId')
  @ApiOperation({ summary: 'Delete chat session' })
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  async deleteSession(@Param('sessionId') sessionId: string, @Req() req: RequestWithContext) {
    const result = await lastValueFrom(this.grpc.chatSessions.deleteSession({ sessionId }, this.metadata.build(req)));
    this.realtime.publishChatEvent(
      RealtimeRooms.chatSession(sessionId),
      ChatRealtimeEvents.sessionDeleted,
      { sessionId },
      this.getPublishContext(req),
    );
    return result;
  }

  private async object(call: Observable<unknown>) {
    return unwrapObjectResponse(await lastValueFrom(call));
  }

  private getUserId(req: RequestWithContext): string {
    const userId = req.context?.userId;
    if (!userId) {
      throw new Error('Missing authenticated user context');
    }
    return userId;
  }

  private getPublishContext(req: RequestWithContext) {
    return {
      requestId: req.context?.requestId,
      correlationId: req.context?.correlationId,
    };
  }

  private getStringField(value: unknown, key: string): string | undefined {
    if (typeof value !== 'object' || value === null) {
      return undefined;
    }
    const field = (value as Record<string, unknown>)[key];
    return typeof field === 'string' ? field : undefined;
  }
}

@ApiTags('Chat - Messages')
@ApiBearerAuth()
@Controller('chat')
export class ChatMessagesGatewayController {
  private readonly logger = new Logger(ChatMessagesGatewayController.name);

  constructor(
    private readonly grpc: BeCoreGrpcClientService,
    private readonly metadata: GrpcMetadataBuilder,
    private readonly realtime: RealtimePublisher,
  ) {}

  @Get('sessions/:sessionId/messages')
  @ApiOperation({ summary: 'Get chat messages' })
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'before', required: false, type: String })
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
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  @ApiBody({ type: SendMessageDto })
  async createMessage(@Param('sessionId') sessionId: string, @Body() body: SendMessageDto, @Req() req: RequestWithContext) {
    this.logger.log(
      `[${req.context?.requestId ?? req.requestId ?? 'unknown'}] controller.createMessage start user=${this.getUserId(req)} sessionId=${sessionId} role=${body.role}`,
    );
    const result = await this.object(this.grpc.chatMessages.createMessage({ sessionId, body: toProtoStruct(body) }, this.metadata.build(req)));
    const messageId = this.getStringField(result, 'id');
    this.logger.log(
      `[${req.context?.requestId ?? req.requestId ?? 'unknown'}] controller.createMessage grpc.ok sessionId=${sessionId} messageId=${messageId ?? 'unknown'}`,
    );
    this.realtime.publishChatEvent(
      RealtimeRooms.chatSession(sessionId),
      ChatRealtimeEvents.messageCreated,
      result,
      this.getPublishContext(req),
    );
    return result;
  }

  @Get('messages/:messageId')
  @ApiOperation({ summary: 'Get message detail' })
  @ApiParam({ name: 'messageId', format: 'uuid' })
  getMessageDetail(@Param('messageId') messageId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.chatMessages.getMessageDetail({ messageId }, this.metadata.build(req)));
  }

  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Delete message' })
  @ApiParam({ name: 'messageId', format: 'uuid' })
  async deleteMessage(@Param('messageId') messageId: string, @Req() req: RequestWithContext) {
    const result = await lastValueFrom(this.grpc.chatMessages.deleteMessage({ messageId }, this.metadata.build(req)));
    this.realtime.publishChatEvent(
      RealtimeRooms.user(this.getUserId(req)),
      ChatRealtimeEvents.messageDeleted,
      { messageId },
      this.getPublishContext(req),
    );
    return result;
  }

  private async object(call: Observable<unknown>) {
    return unwrapObjectResponse(await lastValueFrom(call));
  }

  private getUserId(req: RequestWithContext): string {
    const userId = req.context?.userId;
    if (!userId) {
      throw new Error('Missing authenticated user context');
    }
    return userId;
  }

  private getPublishContext(req: RequestWithContext) {
    return {
      requestId: req.context?.requestId,
      correlationId: req.context?.correlationId,
    };
  }

  private getStringField(value: unknown, key: string): string | undefined {
    if (typeof value !== 'object' || value === null) {
      return undefined;
    }
    const field = (value as Record<string, unknown>)[key];
    return typeof field === 'string' ? field : undefined;
  }
}

@ApiTags('Chat - Analytics')
@ApiBearerAuth()
@Controller('chat/analytics')
export class ChatAnalyticsGatewayController {
  constructor(private readonly grpc: BeCoreGrpcClientService, private readonly metadata: GrpcMetadataBuilder) {}

  @Get('sessions/me')
  @ApiOperation({ summary: 'Get user chat analytics' })
  getMyAnalytics(@Req() req: RequestWithContext) {
    return this.object(this.grpc.chatAnalytics.getMyAnalytics({}, this.metadata.build(req)));
  }

  @Get('classrooms/:classId')
  @ApiOperation({ summary: 'Get classroom AI usage analytics' })
  @ApiParam({ name: 'classId', format: 'uuid' })
  getClassroomAnalytics(@Param('classId') classId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.chatAnalytics.getClassroomAnalytics({ classId }, this.metadata.build(req)));
  }

  private async object(call: Observable<unknown>) {
    return unwrapObjectResponse(await lastValueFrom(call));
  }
}
