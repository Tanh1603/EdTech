import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { createGatewayCorsOptions } from '../common/cors/gateway-cors.config';
import { RealtimeAuthGuard } from './guards/realtime-auth.guard';
import {
  RealtimeGatewayNamespace,
  RealtimeSocketEvents,
} from './realtime.constants';
import { RealtimeAccessService, RealtimeAccessResult } from './realtime-access.service';
import { RealtimePublisher } from './realtime.publisher';
import { RealtimeRooms } from './realtime.rooms';
import {
  AuthenticatedRealtimeSocket,
  RealtimeSubscribePayload,
} from './realtime.types';

@WebSocketGateway({
  namespace: RealtimeGatewayNamespace,
  cors: createGatewayCorsOptions(),
})
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly authGuard: RealtimeAuthGuard,
    private readonly accessService: RealtimeAccessService,
    private readonly publisher: RealtimePublisher,
  ) {}

  afterInit(server: Server): void {
    this.publisher.bindServer(server);
  }

  async handleConnection(socket: AuthenticatedRealtimeSocket): Promise<void> {
    try {
      const authenticatedSocket = await this.authGuard.authenticate(socket);
      await authenticatedSocket.join(RealtimeRooms.user(authenticatedSocket.data.userId));
      authenticatedSocket.emit(RealtimeSocketEvents.connected, {
        userId: authenticatedSocket.data.userId,
      });
    } catch (error) {
      this.logger.warn(
        `Rejected realtime socket: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      socket.disconnect(true);
    }
  }

  @SubscribeMessage(RealtimeSocketEvents.subscribeChatSession)
  subscribeChatSession(
    @ConnectedSocket() socket: AuthenticatedRealtimeSocket,
    @MessageBody() payload: RealtimeSubscribePayload,
  ) {
    return this.joinRoom(
      socket,
      RealtimeSocketEvents.subscribeChatSession,
      payload.sessionId,
      RealtimeRooms.chatSession,
      (id) => this.accessService.validateChatSession(socket, id),
    );
  }

  @SubscribeMessage(RealtimeSocketEvents.unsubscribeChatSession)
  unsubscribeChatSession(
    @ConnectedSocket() socket: AuthenticatedRealtimeSocket,
    @MessageBody() payload: RealtimeSubscribePayload,
  ) {
    return this.leaveRoom(socket, payload.sessionId, RealtimeRooms.chatSession);
  }

  @SubscribeMessage(RealtimeSocketEvents.subscribeClass)
  subscribeClass(
    @ConnectedSocket() socket: AuthenticatedRealtimeSocket,
    @MessageBody() payload: RealtimeSubscribePayload,
  ) {
    return this.joinRoom(
      socket,
      RealtimeSocketEvents.subscribeClass,
      payload.classId,
      RealtimeRooms.class,
      (id) => this.accessService.validateClass(socket, id),
    );
  }

  @SubscribeMessage(RealtimeSocketEvents.unsubscribeClass)
  unsubscribeClass(
    @ConnectedSocket() socket: AuthenticatedRealtimeSocket,
    @MessageBody() payload: RealtimeSubscribePayload,
  ) {
    return this.leaveRoom(socket, payload.classId, RealtimeRooms.class);
  }

  @SubscribeMessage(RealtimeSocketEvents.subscribeExam)
  subscribeExam(
    @ConnectedSocket() socket: AuthenticatedRealtimeSocket,
    @MessageBody() payload: RealtimeSubscribePayload,
  ) {
    return this.joinRoom(
      socket,
      RealtimeSocketEvents.subscribeExam,
      payload.examId,
      RealtimeRooms.exam,
      (id) => this.accessService.validateExam(socket, id),
    );
  }

  @SubscribeMessage(RealtimeSocketEvents.unsubscribeExam)
  unsubscribeExam(
    @ConnectedSocket() socket: AuthenticatedRealtimeSocket,
    @MessageBody() payload: RealtimeSubscribePayload,
  ) {
    return this.leaveRoom(socket, payload.examId, RealtimeRooms.exam);
  }

  @SubscribeMessage(RealtimeSocketEvents.subscribeSubmission)
  subscribeSubmission(
    @ConnectedSocket() socket: AuthenticatedRealtimeSocket,
    @MessageBody() payload: RealtimeSubscribePayload,
  ) {
    return this.joinRoom(
      socket,
      RealtimeSocketEvents.subscribeSubmission,
      payload.submissionId,
      RealtimeRooms.submission,
      (id) => this.accessService.validateSubmission(socket, id),
    );
  }

  @SubscribeMessage(RealtimeSocketEvents.unsubscribeSubmission)
  unsubscribeSubmission(
    @ConnectedSocket() socket: AuthenticatedRealtimeSocket,
    @MessageBody() payload: RealtimeSubscribePayload,
  ) {
    return this.leaveRoom(socket, payload.submissionId, RealtimeRooms.submission);
  }

  @SubscribeMessage(RealtimeSocketEvents.subscribeAiJob)
  subscribeAiJob() {
    return this.notImplemented();
  }

  @SubscribeMessage(RealtimeSocketEvents.unsubscribeAiJob)
  unsubscribeAiJob() {
    return this.notImplemented();
  }

  @SubscribeMessage(RealtimeSocketEvents.subscribeAiChat)
  subscribeAiChat(
    @ConnectedSocket() socket: AuthenticatedRealtimeSocket,
    @MessageBody() payload: RealtimeSubscribePayload,
  ) {
    return this.joinRoom(
      socket,
      RealtimeSocketEvents.subscribeAiChat,
      payload.sessionId,
      RealtimeRooms.aiChat,
      (id) => this.accessService.validateAiChat(socket, id),
    );
  }

  @SubscribeMessage(RealtimeSocketEvents.unsubscribeAiChat)
  unsubscribeAiChat(
    @ConnectedSocket() socket: AuthenticatedRealtimeSocket,
    @MessageBody() payload: RealtimeSubscribePayload,
  ) {
    return this.leaveRoom(socket, payload.sessionId, RealtimeRooms.aiChat);
  }

  private async joinRoom(
    socket: AuthenticatedRealtimeSocket,
    event: string,
    id: string | undefined,
    toRoom: (id: string) => string,
    canJoin: (id: string) => Promise<RealtimeAccessResult>,
  ) {
    const room = this.resolveRoom(id, toRoom);
    if (!room) {
      return this.invalidSubscription();
    }

    const access = await canJoin(id as string);
    if (!access.ok) {
      return access;
    }

    await socket.join(room);
    this.logger.log(
      `realtime.subscribe.ok socketId=${socket.id} user=${socket.data.userId} event=${event} room=${room} resourceId=${id} requestId=${socket.data.requestId} correlationId=${socket.data.correlationId}`,
    );
    return { ok: true, room, subscribed: true };
  }

  private async leaveRoom(
    socket: AuthenticatedRealtimeSocket,
    id: string | undefined,
    toRoom: (id: string) => string,
  ) {
    const room = this.resolveRoom(id, toRoom);
    if (!room) {
      return this.invalidSubscription();
    }

    await socket.leave(room);
    this.logger.log(
      `realtime.unsubscribe.ok socketId=${socket.id} user=${socket.data.userId} room=${room} resourceId=${id} requestId=${socket.data.requestId} correlationId=${socket.data.correlationId}`,
    );
    return { ok: true, room, subscribed: false };
  }

  private resolveRoom(
    id: string | undefined,
    toRoom: (id: string) => string,
  ): string | undefined {
    if (!id || !this.isUuid(id)) {
      return undefined;
    }

    return toRoom(id);
  }

  private invalidSubscription() {
    return {
      ok: false,
      error: 'VALIDATION_ERROR',
      message: 'A valid UUID is required.',
    };
  }

  private notImplemented() {
    return this.accessService.rejectAiJob();
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }
}
