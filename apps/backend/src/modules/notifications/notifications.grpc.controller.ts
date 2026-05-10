import { Metadata } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import {
  GrpcContractMethod,
  GrpcMethods,
  GrpcServices,
  toObjectResponse,
  toPageResponse,
} from '@edtech/contracts';
import { runGrpc } from '../../common/grpc/error-to-rpc-exception';
import { getGrpcUserId } from '../../common/grpc/metadata.mapper';
import { assertServiceToken } from '../../common/grpc/service-token';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationsGrpcController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @GrpcContractMethod(GrpcServices.notifications, GrpcMethods.notifications.createNotification)
  createNotification(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.notificationsService
        .enqueueNotification(
          {
            title: payload.title,
            body: payload.body,
            audience: {
              type: payload.audienceType,
              values: payload.audienceValues ?? [],
            },
            resourceType: payload.resourceType || undefined,
            resourceId: payload.resourceId || undefined,
          },
          getGrpcUserId(metadata),
        )
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.notifications, GrpcMethods.notifications.listMyNotifications)
  listMyNotifications(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.notificationsService
        .listMyNotifications(getGrpcUserId(metadata), {
          page: payload.page || undefined,
          limit: payload.limit || undefined,
          isRead:
            payload.isRead === undefined ? undefined : String(payload.isRead),
        })
        .then((page) => toPageResponse(page as any)),
    );
  }

  @GrpcContractMethod(GrpcServices.notifications, GrpcMethods.notifications.getUnreadCount)
  getUnreadCount(_payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.notificationsService
        .getUnreadCount(getGrpcUserId(metadata))
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.notifications, GrpcMethods.notifications.markNotificationRead)
  markNotificationRead(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.notificationsService
        .markRead(getGrpcUserId(metadata), payload.notificationId)
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.notifications, GrpcMethods.notifications.markAllNotificationsRead)
  markAllNotificationsRead(_payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.notificationsService
        .markAllRead(getGrpcUserId(metadata))
        .then(toObjectResponse),
    );
  }

  private authenticated<T>(metadata: Metadata, callback: () => Promise<T>) {
    assertServiceToken(metadata);
    return runGrpc(callback);
  }
}

