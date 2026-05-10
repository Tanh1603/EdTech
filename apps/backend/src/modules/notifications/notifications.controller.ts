import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateNotificationDto, NotificationQueryDto } from '@edtech/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserPayload } from '../../common/types/current-user.type';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create/send notification' })
  @ApiBody({ type: CreateNotificationDto })
  createNotification(
    @Body() body: CreateNotificationDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.notificationsService.enqueueNotification(body, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List current user notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  listMyNotifications(
    @Query() query: NotificationQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.notificationsService.listMyNotifications(user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  getUnreadCount(@CurrentUser() user: CurrentUserPayload) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser() user: CurrentUserPayload) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Patch(':notificationId/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'notificationId', format: 'uuid' })
  markRead(
    @Param('notificationId') notificationId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.notificationsService.markRead(user.id, notificationId);
  }
}

