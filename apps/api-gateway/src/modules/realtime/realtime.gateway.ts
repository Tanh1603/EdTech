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
import { RealtimePublisher } from './realtime.publisher';
import { RealtimeRooms } from './realtime.rooms';
import {
  AuthenticatedRealtimeSocket,
  RealtimeSubscribePayload,
} from './realtime.types';

@WebSocketGateway({
  namespace: '/realtime',
  cors: createGatewayCorsOptions(),
})
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly authGuard: RealtimeAuthGuard,
    private readonly publisher: RealtimePublisher,
  ) {}

  afterInit(server: Server): void {
    this.publisher.bindServer(server);
  }

  async handleConnection(socket: AuthenticatedRealtimeSocket): Promise<void> {
    try {
      const authenticatedSocket = await this.authGuard.authenticate(socket);
      await authenticatedSocket.join(RealtimeRooms.user(authenticatedSocket.data.userId));
      authenticatedSocket.emit('realtime.connected', {
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

  @SubscribeMessage('subscribe.chatSession')
  subscribeChatSession(
    @ConnectedSocket() socket: AuthenticatedRealtimeSocket,
    @MessageBody() payload: RealtimeSubscribePayload,
  ) {
    return this.joinRoom(socket, payload.sessionId, RealtimeRooms.chatSession);
  }

  @SubscribeMessage('unsubscribe.chatSession')
  unsubscribeChatSession(
    @ConnectedSocket() socket: AuthenticatedRealtimeSocket,
    @MessageBody() payload: RealtimeSubscribePayload,
  ) {
    return this.leaveRoom(socket, payload.sessionId, RealtimeRooms.chatSession);
  }

  @SubscribeMessage('subscribe.class')
  subscribeClass(
    @ConnectedSocket() socket: AuthenticatedRealtimeSocket,
    @MessageBody() payload: RealtimeSubscribePayload,
  ) {
    return this.joinRoom(socket, payload.classId, RealtimeRooms.class);
  }

  @SubscribeMessage('unsubscribe.class')
  unsubscribeClass(
    @ConnectedSocket() socket: AuthenticatedRealtimeSocket,
    @MessageBody() payload: RealtimeSubscribePayload,
  ) {
    return this.leaveRoom(socket, payload.classId, RealtimeRooms.class);
  }

  @SubscribeMessage('subscribe.exam')
  subscribeExam(
    @ConnectedSocket() socket: AuthenticatedRealtimeSocket,
    @MessageBody() payload: RealtimeSubscribePayload,
  ) {
    return this.joinRoom(socket, payload.examId, RealtimeRooms.exam);
  }

  @SubscribeMessage('unsubscribe.exam')
  unsubscribeExam(
    @ConnectedSocket() socket: AuthenticatedRealtimeSocket,
    @MessageBody() payload: RealtimeSubscribePayload,
  ) {
    return this.leaveRoom(socket, payload.examId, RealtimeRooms.exam);
  }

  @SubscribeMessage('subscribe.submission')
  subscribeSubmission(
    @ConnectedSocket() socket: AuthenticatedRealtimeSocket,
    @MessageBody() payload: RealtimeSubscribePayload,
  ) {
    return this.joinRoom(socket, payload.submissionId, RealtimeRooms.submission);
  }

  @SubscribeMessage('unsubscribe.submission')
  unsubscribeSubmission(
    @ConnectedSocket() socket: AuthenticatedRealtimeSocket,
    @MessageBody() payload: RealtimeSubscribePayload,
  ) {
    return this.leaveRoom(socket, payload.submissionId, RealtimeRooms.submission);
  }

  @SubscribeMessage('subscribe.aiJob')
  subscribeAiJob(
    @ConnectedSocket() socket: AuthenticatedRealtimeSocket,
    @MessageBody() payload: RealtimeSubscribePayload,
  ) {
    return this.joinRoom(socket, payload.jobId, RealtimeRooms.aiJob);
  }

  @SubscribeMessage('unsubscribe.aiJob')
  unsubscribeAiJob(
    @ConnectedSocket() socket: AuthenticatedRealtimeSocket,
    @MessageBody() payload: RealtimeSubscribePayload,
  ) {
    return this.leaveRoom(socket, payload.jobId, RealtimeRooms.aiJob);
  }

  @SubscribeMessage('subscribe.aiChat')
  subscribeAiChat(
    @ConnectedSocket() socket: AuthenticatedRealtimeSocket,
    @MessageBody() payload: RealtimeSubscribePayload,
  ) {
    return this.joinRoom(socket, payload.sessionId, RealtimeRooms.aiChat);
  }

  @SubscribeMessage('unsubscribe.aiChat')
  unsubscribeAiChat(
    @ConnectedSocket() socket: AuthenticatedRealtimeSocket,
    @MessageBody() payload: RealtimeSubscribePayload,
  ) {
    return this.leaveRoom(socket, payload.sessionId, RealtimeRooms.aiChat);
  }

  private async joinRoom(
    socket: AuthenticatedRealtimeSocket,
    id: string | undefined,
    toRoom: (id: string) => string,
  ) {
    const room = this.resolveRoom(id, toRoom);
    if (!room) {
      return this.invalidSubscription();
    }

    await socket.join(room);
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

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }
}
