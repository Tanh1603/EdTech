import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { ExportAnalyticsDto } from '../dto/export-analytics.dto';
import { LogsQueryDto } from '../dto/logs-query.dto';
import { OpsService } from '../services/ops.service';

@Controller()
export class OpsController {
  constructor(private readonly opsService: OpsService) {}

  @Get('jobs/:jobId')
  getJobStatus(@Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.opsService.getJobStatus(jobId);
  }

  @Get('analytics/student')
  getStudentAnalytics() {
    return this.opsService.getStudentAnalytics();
  }

  @Get('analytics/class/:classId')
  getClassAnalytics(@Param('classId', ParseUUIDPipe) classId: string) {
    return this.opsService.getClassAnalytics(classId);
  }

  @Post('analytics/export')
  exportAnalytics(@Body() payload: ExportAnalyticsDto) {
    return this.opsService.exportAnalytics(payload);
  }

  @Get('notifications')
  getNotifications(@Query() query: PaginationQueryDto) {
    return this.opsService.getNotifications(query.page ?? 1, query.limit ?? 20);
  }

  @Post('notifications')
  createNotification(@Body() payload: CreateNotificationDto) {
    return this.opsService.createNotification(payload);
  }

  @Get('admin/metrics')
  getAdminMetrics() {
    return this.opsService.getAdminMetrics();
  }

  @Get('admin/agents/monitor')
  getAgentsMonitor() {
    return this.opsService.getAgentsMonitor();
  }

  @Get('admin/logs')
  getAdminLogs(@Query() query: LogsQueryDto) {
    return this.opsService.getAdminLogs(query.page ?? 1, query.limit ?? 20);
  }
}

