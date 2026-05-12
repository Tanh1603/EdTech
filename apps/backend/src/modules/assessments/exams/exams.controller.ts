import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserPayload } from '../../../common/types/current-user.type';
import { AssessmentsSharedService } from '../shared/assessments-shared.service';
import { CreateExamDto, UpdateExamDto } from '@edtech/contracts';
import { ExamsQueryDto } from '@edtech/contracts';

@ApiTags('Assessments - Exams')
@ApiBearerAuth()
@Controller('assessments/exams')
export class ExamsController {
  constructor(private readonly assessmentsService: AssessmentsSharedService) {}

  @Post()
  @ApiOperation({ summary: 'Create exam' })
  @ApiBody({ type: CreateExamDto })
  @ApiCreatedResponse({ description: 'Exam created successfully' })
  createExam(@Body() body: CreateExamDto, @CurrentUser() user: CurrentUserPayload) {
    return this.assessmentsService.createExam(body, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get exams list' })
  @ApiQuery({ name: 'classId', required: false, format: 'uuid' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiOkResponse({ description: 'Exams returned successfully' })
  getExams(@Query() query: ExamsQueryDto, @CurrentUser() user: CurrentUserPayload) {
    return this.assessmentsService.getExams(query, user.id);
  }

  @Get(':examId')
  @ApiOperation({ summary: 'Get exam detail' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  @ApiOkResponse({ description: 'Exam detail returned successfully' })
  getExamDetail(
    @Param('examId', ParseUUIDPipe) examId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assessmentsService.getExamDetail(examId, user.id);
  }

  @Patch(':examId')
  @ApiOperation({ summary: 'Update exam' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  @ApiBody({ type: UpdateExamDto })
  @ApiOkResponse({ description: 'Exam updated successfully' })
  updateExam(
    @Param('examId', ParseUUIDPipe) examId: string,
    @Body() body: UpdateExamDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assessmentsService.updateExam(examId, body, user.id);
  }

  @Delete(':examId')
  @ApiOperation({ summary: 'Delete exam' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  @ApiOkResponse({ description: 'Exam deleted successfully' })
  deleteExam(
    @Param('examId', ParseUUIDPipe) examId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assessmentsService.deleteExam(examId, user.id);
  }

  @Post(':examId/publish')
  @ApiOperation({ summary: 'Publish exam' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  @ApiOkResponse({ description: 'Exam published successfully' })
  publishExam(
    @Param('examId', ParseUUIDPipe) examId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assessmentsService.publishExam(examId, user.id);
  }

  @Post(':examId/close')
  @ApiOperation({ summary: 'Close exam' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  @ApiOkResponse({ description: 'Exam closed successfully' })
  closeExam(
    @Param('examId', ParseUUIDPipe) examId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assessmentsService.closeExam(examId, user.id);
  }
}
