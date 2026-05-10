import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateNotificationDto,
  NotificationQueryDto,
  unwrapObjectResponse,
  unwrapPageResponse,
} from '@edtech/contracts';
import { lastValueFrom } from 'rxjs';
import { GrpcMetadataBuilder } from '../common/grpc-metadata/grpc-metadata.builder';
import { RequestWithContext } from '../common/types/request-with-context';
import { BeCoreGrpcClientService } from '../grpc-clients/be-core-grpc-client.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsGatewayController {
  constructor(
    private readonly grpc: BeCoreGrpcClientService,
    private readonly metadata: GrpcMetadataBuilder,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create/send notification' })
  @ApiBody({ type: CreateNotificationDto })
  async createNotification(
    @Body() body: CreateNotificationDto,
    @Req() req: RequestWithContext,
  ) {
    return unwrapObjectResponse(
      await lastValueFrom(
        this.grpc.notifications.createNotification(
          {
            title: body.title,
            body: body.body,
            audienceType: body.audience.type,
            audienceValues: body.audience.values,
            resourceType: body.resourceType,
            resourceId: body.resourceId,
          },
          this.metadata.build(req),
        ),
      ),
    );
  }

  @Get()
  @ApiOperation({ summary: 'List current user notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  async listMyNotifications(
    @Query() query: NotificationQueryDto,
    @Req() req: RequestWithContext,
  ) {
    return unwrapPageResponse(
      await lastValueFrom(
        this.grpc.notifications.listMyNotifications(
          {
            page: Number(query.page) || undefined,
            limit: Number(query.limit) || undefined,
            isRead:
              query.isRead === undefined ? undefined : query.isRead === 'true',
          },
          this.metadata.build(req),
        ),
      ),
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@Req() req: RequestWithContext) {
    return unwrapObjectResponse(
      await lastValueFrom(
        this.grpc.notifications.getUnreadCount({}, this.metadata.build(req)),
      ),
    );
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@Req() req: RequestWithContext) {
    return unwrapObjectResponse(
      await lastValueFrom(
        this.grpc.notifications.markAllNotificationsRead(
          {},
          this.metadata.build(req),
        ),
      ),
    );
  }

  @Patch(':notificationId/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'notificationId', format: 'uuid' })
  async markRead(
    @Param('notificationId') notificationId: string,
    @Req() req: RequestWithContext,
  ) {
    return unwrapObjectResponse(
      await lastValueFrom(
        this.grpc.notifications.markNotificationRead(
          { notificationId },
          this.metadata.build(req),
        ),
      ),
    );
  }
}

