import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserPayload } from '../../common/types/current-user.type';
import { AssessmentsService } from './assessments.service';
import { CreateExamDto, UpdateExamDto } from './dto/exam.dto';
import { ExamsQueryDto, ResultsQueryDto, SubmissionsQueryDto } from './dto/query.dto';
import { CreateQuestionDto, ReorderQuestionsDto, UpdateQuestionDto } from './dto/question.dto';
import { AiGradingDto, AutoSaveAnswersDto, BulkAiGradingDto, ProctoringEventDto, SubmitExamDto } from './dto/submission.dto';

@ApiTags('Assessments')
@ApiBearerAuth()
@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post('exams')
  @ApiOperation({ summary: 'Create exam' })
  @ApiBody({ type: CreateExamDto })
  @ApiCreatedResponse({ description: 'Exam created successfully' })
  createExam(@Body() body: CreateExamDto, @CurrentUser() user: CurrentUserPayload) {
    return this.assessmentsService.createExam(body, user.id);
  }

  @Get('exams')
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

  @Get('exams/:examId')
  @ApiOperation({ summary: 'Get exam detail' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  getExamDetail(@Param('examId', ParseUUIDPipe) examId: string) {
    return this.assessmentsService.getExamDetail(examId);
  }

  @Patch('exams/:examId')
  @ApiOperation({ summary: 'Update exam' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  @ApiBody({ type: UpdateExamDto })
  updateExam(@Param('examId', ParseUUIDPipe) examId: string, @Body() body: UpdateExamDto) {
    return this.assessmentsService.updateExam(examId, body);
  }

  @Delete('exams/:examId')
  @ApiOperation({ summary: 'Delete exam' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  deleteExam(@Param('examId', ParseUUIDPipe) examId: string) {
    return this.assessmentsService.deleteExam(examId);
  }

  @Post('exams/:examId/publish')
  @ApiOperation({ summary: 'Publish exam' })
  publishExam(@Param('examId', ParseUUIDPipe) examId: string) {
    return this.assessmentsService.publishExam(examId);
  }

  @Post('exams/:examId/archive')
  @ApiOperation({ summary: 'Archive exam' })
  archiveExam(@Param('examId', ParseUUIDPipe) examId: string) {
    return this.assessmentsService.archiveExam(examId);
  }

  @Post('exams/:examId/duplicate')
  @ApiOperation({ summary: 'Duplicate exam' })
  duplicateExam(@Param('examId', ParseUUIDPipe) examId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.assessmentsService.duplicateExam(examId, user.id);
  }

  @Post('exams/:examId/questions')
  @ApiOperation({ summary: 'Create question' })
  @ApiBody({ type: CreateQuestionDto })
  createQuestion(@Param('examId', ParseUUIDPipe) examId: string, @Body() body: CreateQuestionDto) {
    return this.assessmentsService.createQuestion(examId, body);
  }

  @Get('exams/:examId/questions')
  @ApiOperation({ summary: 'Get exam questions' })
  getExamQuestions(@Param('examId', ParseUUIDPipe) examId: string) {
    return this.assessmentsService.getExamQuestions(examId);
  }

  @Get('questions/:questionId')
  @ApiOperation({ summary: 'Get question detail' })
  getQuestionDetail(@Param('questionId', ParseUUIDPipe) questionId: string) {
    return this.assessmentsService.getQuestionDetail(questionId);
  }

  @Patch('questions/:questionId')
  @ApiOperation({ summary: 'Update question' })
  @ApiBody({ type: UpdateQuestionDto })
  updateQuestion(@Param('questionId', ParseUUIDPipe) questionId: string, @Body() body: UpdateQuestionDto) {
    return this.assessmentsService.updateQuestion(questionId, body);
  }

  @Delete('questions/:questionId')
  @ApiOperation({ summary: 'Delete question' })
  deleteQuestion(@Param('questionId', ParseUUIDPipe) questionId: string) {
    return this.assessmentsService.deleteQuestion(questionId);
  }

  @Post('questions/reorder')
  @ApiOperation({ summary: 'Reorder questions' })
  @ApiBody({ type: ReorderQuestionsDto })
  reorderQuestions(@Body() body: ReorderQuestionsDto) {
    return this.assessmentsService.reorderQuestions(body);
  }

  @Get('my-exams')
  @ApiOperation({ summary: 'Get student assigned exams' })
  getMyExams(@Query('status') status: string | undefined, @CurrentUser() user: CurrentUserPayload) {
    return this.assessmentsService.getMyExams(status, user.id);
  }

  @Get('my-exams/:examId')
  @ApiOperation({ summary: 'Get student exam detail' })
  getMyExamDetail(@Param('examId', ParseUUIDPipe) examId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.assessmentsService.getMyExamDetail(examId, user.id);
  }

  @Post('my-exams/:examId/start')
  @ApiOperation({ summary: 'Start exam attempt' })
  startExam(@Param('examId', ParseUUIDPipe) examId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.assessmentsService.startExam(examId, user.id);
  }

  @Post('my-exams/:examId/submit')
  @ApiOperation({ summary: 'Submit exam' })
  @ApiBody({ type: SubmitExamDto })
  submitExam(@Param('examId', ParseUUIDPipe) examId: string, @Body() body: SubmitExamDto, @CurrentUser() user: CurrentUserPayload) {
    return this.assessmentsService.submitExam(examId, body, user.id);
  }

  @Post('my-exams/:examId/auto-save')
  @ApiOperation({ summary: 'Auto save draft answers' })
  @ApiBody({ type: AutoSaveAnswersDto })
  autoSaveExam(@Param('examId', ParseUUIDPipe) examId: string, @Body() body: AutoSaveAnswersDto, @CurrentUser() user: CurrentUserPayload) {
    return this.assessmentsService.autoSaveExam(examId, body, user.id);
  }

  @Get('submissions')
  @ApiOperation({ summary: 'Get submissions list' })
  getSubmissions(@Query() query: SubmissionsQueryDto) {
    return this.assessmentsService.getSubmissions(query);
  }

  @Get('submissions/:submissionId')
  @ApiOperation({ summary: 'Get submission detail' })
  getSubmissionDetail(@Param('submissionId', ParseUUIDPipe) submissionId: string) {
    return this.assessmentsService.getSubmissionDetail(submissionId);
  }

  @Post('submissions/:submissionId/regrade')
  @ApiOperation({ summary: 'Regrade submission by AI' })
  regradeSubmission(@Param('submissionId', ParseUUIDPipe) submissionId: string) {
    return this.assessmentsService.regradeSubmission(submissionId);
  }

  @Get('results/me')
  @ApiOperation({ summary: 'Get current student results' })
  getMyResults(@Query() query: ResultsQueryDto, @CurrentUser() user: CurrentUserPayload) {
    return this.assessmentsService.getMyResults(query, user.id);
  }

  @Get('results/analytics')
  @ApiOperation({ summary: 'Get exam analytics' })
  getResultsAnalytics() {
    return this.assessmentsService.getResultsAnalytics();
  }

  @Get('results/:submissionId')
  @ApiOperation({ summary: 'Get exam result' })
  getResult(@Param('submissionId', ParseUUIDPipe) submissionId: string) {
    return this.assessmentsService.getResult(submissionId);
  }

  @Post('grading/ai')
  @ApiOperation({ summary: 'Trigger AI grading' })
  @ApiBody({ type: AiGradingDto })
  triggerAiGrading(@Body() body: AiGradingDto) {
    return this.assessmentsService.triggerAiGrading(body.submissionId);
  }

  @Post('grading/ai/bulk')
  @ApiOperation({ summary: 'Bulk AI grading' })
  @ApiBody({ type: BulkAiGradingDto })
  triggerBulkAiGrading(@Body() body: BulkAiGradingDto) {
    return this.assessmentsService.triggerBulkAiGrading(body);
  }

  @Get('grading/jobs/:jobId')
  @ApiOperation({ summary: 'Get grading job status' })
  getGradingJob(@Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.assessmentsService.getGradingJob(jobId);
  }

  @Post('proctoring/events')
  @ApiOperation({ summary: 'Track suspicious event' })
  @ApiBody({ type: ProctoringEventDto })
  trackProctoringEvent(@Body() body: ProctoringEventDto) {
    return this.assessmentsService.trackProctoringEvent(body);
  }

  @Get('proctoring/submissions/:submissionId')
  @ApiOperation({ summary: 'Get cheating risk analysis' })
  getProctoringRisk(@Param('submissionId', ParseUUIDPipe) submissionId: string) {
    return this.assessmentsService.getProctoringRisk(submissionId);
  }
}
