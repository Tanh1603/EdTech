import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserPayload } from '../../../common/types/current-user.type';
import { AssessmentsSharedService } from '../shared/assessments-shared.service';
import { CreateExamDto, UpdateExamDto } from '../shared/dto/exam.dto';
import { ExamsQueryDto } from '../shared/dto/query.dto';

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
  getExams(@Query() query: ExamsQueryDto) {
    return this.assessmentsService.getExams(query);
  }

  @Get(':examId')
  @ApiOperation({ summary: 'Get exam detail' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  @ApiOkResponse({ description: 'Exam detail returned successfully' })
  getExamDetail(@Param('examId', ParseUUIDPipe) examId: string) {
    return this.assessmentsService.getExamDetail(examId);
  }

  @Patch(':examId')
  @ApiOperation({ summary: 'Update exam' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  @ApiBody({ type: UpdateExamDto })
  @ApiOkResponse({ description: 'Exam updated successfully' })
  updateExam(@Param('examId', ParseUUIDPipe) examId: string, @Body() body: UpdateExamDto) {
    return this.assessmentsService.updateExam(examId, body);
  }

  @Delete(':examId')
  @ApiOperation({ summary: 'Delete exam' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  @ApiOkResponse({ description: 'Exam deleted successfully' })
  deleteExam(@Param('examId', ParseUUIDPipe) examId: string) {
    return this.assessmentsService.deleteExam(examId);
  }

  @Post(':examId/publish')
  @ApiOperation({ summary: 'Publish exam' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  @ApiOkResponse({ description: 'Exam published successfully' })
  publishExam(@Param('examId', ParseUUIDPipe) examId: string) {
    return this.assessmentsService.publishExam(examId);
  }

  @Post(':examId/close')
  @ApiOperation({ summary: 'Close exam' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  @ApiOkResponse({ description: 'Exam closed successfully' })
  closeExam(@Param('examId', ParseUUIDPipe) examId: string) {
    return this.assessmentsService.closeExam(examId);
  }
}
