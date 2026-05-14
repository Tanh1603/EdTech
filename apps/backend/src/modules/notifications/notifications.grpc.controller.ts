import { Metadata } from '@grpc/grpc-js';
import { Controller, UseGuards } from '@nestjs/common';
import {
  GrpcContractMethod,
  GrpcMethods,
  GrpcServices,
  RolePermissions,
  toObjectResponse,
  toPageResponse,
} from '@edtech/contracts';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { GrpcUserAuthGuard } from '../../common/guards/grpc-user-auth.guard';
import { getGrpcUserId } from '../../common/grpc/metadata.mapper';
import { NotificationsService } from './notifications.service';

@Controller()
@UseGuards(GrpcUserAuthGuard)
export class NotificationsGrpcController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @GrpcContractMethod(
    GrpcServices.notifications,
    GrpcMethods.notifications.createNotification,
  )
  @Permissions(RolePermissions.notificationsManage)
  createNotification(payload: any, metadata: Metadata) {
    return this.notificationsService
      .createNotification(
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
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.notifications,
    GrpcMethods.notifications.listMyNotifications,
  )
  @Permissions(RolePermissions.notificationsReadOwn)
  listMyNotifications(payload: any, metadata: Metadata) {
    return this.notificationsService
      .listMyNotifications(getGrpcUserId(metadata), {
        page: payload.page || undefined,
        limit: payload.limit || undefined,
        isRead:
          payload.isRead === undefined ? undefined : String(payload.isRead),
      })
      .then((page) => toPageResponse(page as any));
  }

  @GrpcContractMethod(
    GrpcServices.notifications,
    GrpcMethods.notifications.getUnreadCount,
  )
  @Permissions(RolePermissions.notificationsReadOwn)
  getUnreadCount(_payload: any, metadata: Metadata) {
    return this.notificationsService
      .getUnreadCount(getGrpcUserId(metadata))
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.notifications,
    GrpcMethods.notifications.markNotificationRead,
  )
  @Permissions(RolePermissions.notificationsReadOwn)
  markNotificationRead(payload: any, metadata: Metadata) {
    return this.notificationsService
      .markRead(getGrpcUserId(metadata), payload.notificationId)
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.notifications,
    GrpcMethods.notifications.markAllNotificationsRead,
  )
  @Permissions(RolePermissions.notificationsReadOwn)
  markAllNotificationsRead(_payload: any, metadata: Metadata) {
    return this.notificationsService
      .markAllRead(getGrpcUserId(metadata))
      .then(toObjectResponse);
  }
}
