import { Metadata } from '@grpc/grpc-js';
import { Controller, UseGuards } from '@nestjs/common';
import {
  GrpcContractMethod,
  GrpcMethods,
  GrpcServices,
  RolePermissions,
} from '@edtech/contracts';
import {
  fromProtoStruct,
  toObjectResponse,
  toPageResponse,
} from '@edtech/contracts';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { GrpcUserAuthGuard } from '../../../common/guards/grpc-user-auth.guard';
import {
  getGrpcIdentity,
  getGrpcUserId,
} from '../../../common/grpc/metadata.mapper';
import { ChatSharedService } from './chat-shared.service';

@Controller()
@UseGuards(GrpcUserAuthGuard)
@Permissions(RolePermissions.chatUse)
export class ChatGrpcController {
  constructor(private readonly chatService: ChatSharedService) {}

  @GrpcContractMethod(
    GrpcServices.chatSessions,
    GrpcMethods.chatSessions.createSession,
  )
  createSession(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return Promise.resolve(
      this.chatService.createSession(
        fromProtoStruct(payload.body) as any,
        identity.userId,
        identity.roles,
      ),
    ).then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.chatSessions,
    GrpcMethods.chatSessions.getSessions,
  )
  getSessions(payload: any, metadata: Metadata) {
    return this.chatService
      .getSessions(
        {
          classId: payload.classId || undefined,
          page: payload.page || undefined,
          limit: payload.limit || undefined,
          search: payload.search || undefined,
        },
        getGrpcUserId(metadata),
      )
      .then((page) => toPageResponse(page as any));
  }

  @GrpcContractMethod(
    GrpcServices.chatSessions,
    GrpcMethods.chatSessions.getSessionDetail,
  )
  getSessionDetail(payload: any, metadata: Metadata) {
    return Promise.resolve(
      this.chatService.getSessionDetail(
        payload.sessionId,
        getGrpcUserId(metadata),
      ),
    ).then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.chatSessions,
    GrpcMethods.chatSessions.updateSession,
  )
  updateSession(payload: any, metadata: Metadata) {
    return this.chatService
      .updateSession(
        payload.sessionId,
        fromProtoStruct(payload.body) as any,
        getGrpcUserId(metadata),
      )
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.chatSessions,
    GrpcMethods.chatSessions.deleteSession,
  )
  deleteSession(payload: any, metadata: Metadata) {
    return this.chatService.deleteSession(
      payload.sessionId,
      getGrpcUserId(metadata),
    );
  }

  @GrpcContractMethod(
    GrpcServices.chatMessages,
    GrpcMethods.chatMessages.getMessages,
  )
  getMessages(payload: any, metadata: Metadata) {
    return this.chatService
      .getMessages(
        payload.sessionId,
        {
          page: payload.page || undefined,
          limit: payload.limit || undefined,
          before: payload.before || undefined,
        },
        getGrpcUserId(metadata),
      )
      .then((page) => toPageResponse(page as any));
  }

  @GrpcContractMethod(
    GrpcServices.chatMessages,
    GrpcMethods.chatMessages.createMessage,
  )
  createMessage(payload: any, metadata: Metadata) {
    return this.chatService
      .createMessage(
        payload.sessionId,
        fromProtoStruct(payload.body) as any,
        getGrpcUserId(metadata),
      )
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.chatMessages,
    GrpcMethods.chatMessages.getMessageDetail,
  )
  getMessageDetail(payload: any, metadata: Metadata) {
    return Promise.resolve(
      this.chatService.getMessageDetail(
        payload.messageId,
        getGrpcUserId(metadata),
      ),
    ).then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.chatMessages,
    GrpcMethods.chatMessages.deleteMessage,
  )
  deleteMessage(payload: any, metadata: Metadata) {
    return this.chatService.deleteMessage(
      payload.messageId,
      getGrpcUserId(metadata),
    );
  }

  @GrpcContractMethod(
    GrpcServices.chatAnalytics,
    GrpcMethods.chatAnalytics.getMyAnalytics,
  )
  getMyAnalytics(_: any, metadata: Metadata) {
    return this.chatService
      .getMyAnalytics(getGrpcUserId(metadata))
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.chatAnalytics,
    GrpcMethods.chatAnalytics.getClassroomAnalytics,
  )
  getClassroomAnalytics(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.chatService
      .getClassroomAnalytics(payload.classId, identity.userId, identity.roles)
      .then(toObjectResponse);
  }
}
