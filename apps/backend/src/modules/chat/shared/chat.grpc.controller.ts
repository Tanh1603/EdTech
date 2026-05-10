import { Metadata } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  fromProtoStruct,
  toObjectResponse,
  toPageResponse,
} from '../../../common/grpc/json.mapper';
import { getGrpcUserId } from '../../../common/grpc/metadata.mapper';
import { runGrpc } from '../../../common/grpc/error-to-rpc-exception';
import { assertServiceToken } from '../../../common/grpc/service-token';
import { ChatSharedService } from './chat-shared.service';

@Controller()
export class ChatGrpcController {
  constructor(private readonly chatService: ChatSharedService) {}

  @GrpcMethod('ChatSessionsService', 'CreateSession')
  createSession(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      Promise.resolve(
        this.chatService.createSession(
          fromProtoStruct(payload.body) as any,
          getGrpcUserId(metadata),
        ),
      ).then(toObjectResponse),
    );
  }

  @GrpcMethod('ChatSessionsService', 'GetSessions')
  getSessions(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.chatService.getSessions(
        {
          classId: payload.classId || undefined,
          page: payload.page || undefined,
          limit: payload.limit || undefined,
          search: payload.search || undefined,
        },
        getGrpcUserId(metadata),
      ).then((page) => toPageResponse(page as any)),
    );
  }

  @GrpcMethod('ChatSessionsService', 'GetSessionDetail')
  getSessionDetail(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      Promise.resolve(
        this.chatService.getSessionDetail(payload.sessionId, getGrpcUserId(metadata)),
      ).then(toObjectResponse),
    );
  }

  @GrpcMethod('ChatSessionsService', 'UpdateSession')
  updateSession(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.chatService
        .updateSession(
          payload.sessionId,
          fromProtoStruct(payload.body) as any,
          getGrpcUserId(metadata),
        )
        .then(toObjectResponse),
    );
  }

  @GrpcMethod('ChatSessionsService', 'DeleteSession')
  deleteSession(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.chatService.deleteSession(payload.sessionId, getGrpcUserId(metadata)),
    );
  }

  @GrpcMethod('ChatMessagesService', 'GetMessages')
  getMessages(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.chatService.getMessages(
        payload.sessionId,
        {
          page: payload.page || undefined,
          limit: payload.limit || undefined,
          before: payload.before || undefined,
        },
        getGrpcUserId(metadata),
      ).then((page) => toPageResponse(page as any)),
    );
  }

  @GrpcMethod('ChatMessagesService', 'CreateMessage')
  createMessage(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.chatService
        .createMessage(
          payload.sessionId,
          fromProtoStruct(payload.body) as any,
          getGrpcUserId(metadata),
        )
        .then(toObjectResponse),
    );
  }

  @GrpcMethod('ChatMessagesService', 'GetMessageDetail')
  getMessageDetail(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      Promise.resolve(this.chatService.getMessageDetail(payload.messageId)).then(
        toObjectResponse,
      ),
    );
  }

  @GrpcMethod('ChatMessagesService', 'DeleteMessage')
  deleteMessage(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.chatService.deleteMessage(payload.messageId),
    );
  }

  @GrpcMethod('ChatAnalyticsService', 'GetMyAnalytics')
  getMyAnalytics(_: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.chatService.getMyAnalytics(getGrpcUserId(metadata)).then(toObjectResponse),
    );
  }

  @GrpcMethod('ChatAnalyticsService', 'GetClassroomAnalytics')
  getClassroomAnalytics(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.chatService
        .getClassroomAnalytics(payload.classId)
        .then(toObjectResponse),
    );
  }

  private authenticated<T>(metadata: Metadata, callback: () => Promise<T>) {
    assertServiceToken(metadata);
    return runGrpc(callback);
  }
}
