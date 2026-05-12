import { Metadata } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcContractMethod, GrpcMethods, GrpcServices } from '@edtech/contracts';
import {
  fromProtoStruct,
  toObjectResponse,
  toPageResponse,
} from '@edtech/contracts';
import { getAuthenticatedGrpcUserId } from '../../../common/grpc/metadata.mapper';
import { runGrpc } from '../../../common/grpc/error-to-rpc-exception';
import { assertServiceToken } from '../../../common/grpc/service-token';
import { ChatSharedService } from './chat-shared.service';

@Controller()
export class ChatGrpcController {
  constructor(private readonly chatService: ChatSharedService) {}

  @GrpcContractMethod(GrpcServices.chatSessions, GrpcMethods.chatSessions.createSession)
  createSession(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () => {
      const userId = await getAuthenticatedGrpcUserId(metadata);
      return Promise.resolve(
        this.chatService.createSession(
          fromProtoStruct(payload.body) as any,
          userId,
        ),
      ).then(toObjectResponse);
    });
  }

  @GrpcContractMethod(GrpcServices.chatSessions, GrpcMethods.chatSessions.getSessions)
  getSessions(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      this.chatService.getSessions(
        {
          classId: payload.classId || undefined,
          page: payload.page || undefined,
          limit: payload.limit || undefined,
          search: payload.search || undefined,
        },
        await getAuthenticatedGrpcUserId(metadata),
      ).then((page) => toPageResponse(page as any)),
    );
  }

  @GrpcContractMethod(GrpcServices.chatSessions, GrpcMethods.chatSessions.getSessionDetail)
  getSessionDetail(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      Promise.resolve(
        this.chatService.getSessionDetail(
          payload.sessionId,
          await getAuthenticatedGrpcUserId(metadata),
        ),
      ).then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.chatSessions, GrpcMethods.chatSessions.updateSession)
  updateSession(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      this.chatService
        .updateSession(
          payload.sessionId,
          fromProtoStruct(payload.body) as any,
          await getAuthenticatedGrpcUserId(metadata),
        )
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.chatSessions, GrpcMethods.chatSessions.deleteSession)
  deleteSession(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      this.chatService.deleteSession(
        payload.sessionId,
        await getAuthenticatedGrpcUserId(metadata),
      ),
    );
  }

  @GrpcContractMethod(GrpcServices.chatMessages, GrpcMethods.chatMessages.getMessages)
  getMessages(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      this.chatService.getMessages(
        payload.sessionId,
        {
          page: payload.page || undefined,
          limit: payload.limit || undefined,
          before: payload.before || undefined,
        },
        await getAuthenticatedGrpcUserId(metadata),
      ).then((page) => toPageResponse(page as any)),
    );
  }

  @GrpcContractMethod(GrpcServices.chatMessages, GrpcMethods.chatMessages.createMessage)
  createMessage(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      this.chatService
        .createMessage(
          payload.sessionId,
          fromProtoStruct(payload.body) as any,
          await getAuthenticatedGrpcUserId(metadata),
        )
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.chatMessages, GrpcMethods.chatMessages.getMessageDetail)
  getMessageDetail(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      Promise.resolve(
        this.chatService.getMessageDetail(
          payload.messageId,
          await getAuthenticatedGrpcUserId(metadata),
        ),
      ).then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.chatMessages, GrpcMethods.chatMessages.deleteMessage)
  deleteMessage(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      this.chatService.deleteMessage(
        payload.messageId,
        await getAuthenticatedGrpcUserId(metadata),
      ),
    );
  }

  @GrpcContractMethod(GrpcServices.chatAnalytics, GrpcMethods.chatAnalytics.getMyAnalytics)
  getMyAnalytics(_: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      this.chatService
        .getMyAnalytics(await getAuthenticatedGrpcUserId(metadata))
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.chatAnalytics, GrpcMethods.chatAnalytics.getClassroomAnalytics)
  getClassroomAnalytics(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      this.chatService
        .getClassroomAnalytics(
          payload.classId,
          await getAuthenticatedGrpcUserId(metadata),
        )
        .then(toObjectResponse),
    );
  }

  private authenticated<T>(metadata: Metadata, callback: () => Promise<T>) {
    assertServiceToken(metadata);
    return runGrpc(callback);
  }
}
