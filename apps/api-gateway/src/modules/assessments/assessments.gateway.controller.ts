import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { lastValueFrom, Observable } from 'rxjs';
import {
  AnswersDto,
  AssessmentRealtimeEvents,
  CreateExamDto,
  CreateQuestionDto,
  ExamsQueryDto,
  ManualGradeDto,
  ReorderQuestionsDto,
  UpdateExamDto,
  UpdateQuestionDto,
} from '@edtech/contracts';
import { GrpcMetadataBuilder } from '../common/grpc-metadata/grpc-metadata.builder';
import { toProtoStruct, unwrapListResponse, unwrapObjectResponse, unwrapPageResponse } from '@edtech/contracts';
import { RequestWithContext } from '../common/types/request-with-context';
import { BeCoreGrpcClientService } from '../grpc-clients/be-core-grpc-client.service';
import { RealtimePublisher } from '../realtime/realtime.publisher';
import { RealtimeRooms } from '../realtime/realtime.rooms';

@ApiTags('Assessments - Exams')
@ApiBearerAuth()
@Controller('assessments/exams')
export class AssessmentExamsGatewayController {
  constructor(
    private readonly grpc: BeCoreGrpcClientService,
    private readonly metadata: GrpcMetadataBuilder,
    private readonly realtime: RealtimePublisher,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create exam' })
  @ApiBody({ type: CreateExamDto })
  async createExam(@Body() body: CreateExamDto, @Req() req: RequestWithContext) {
    const result = await this.object(this.grpc.assessmentExams.createExam({ body: toProtoStruct(body) }, this.metadata.build(req)));
    this.realtime.publishExamEvent(
      RealtimeRooms.class(body.classId),
      AssessmentRealtimeEvents.examCreated,
      result,
      this.getPublishContext(req),
    );
    return result;
  }

  @Get()
  @ApiOperation({ summary: 'Get exams list' })
  @ApiQuery({ name: 'classId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  async getExams(@Query() query: ExamsQueryDto, @Req() req: RequestWithContext) {
    return unwrapPageResponse(await lastValueFrom(this.grpc.assessmentExams.getExams({
      classId: query.classId,
      status: query.status,
      page: Number(query.page) || undefined,
      limit: Number(query.limit) || undefined,
      search: query.search,
    }, this.metadata.build(req))));
  }

  @Get(':examId')
  @ApiOperation({ summary: 'Get exam detail' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  getExamDetail(@Param('examId') examId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentExams.getExamDetail({ examId }, this.metadata.build(req)));
  }

  @Patch(':examId')
  @ApiOperation({ summary: 'Update exam' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  @ApiBody({ type: UpdateExamDto })
  async updateExam(@Param('examId') examId: string, @Body() body: UpdateExamDto, @Req() req: RequestWithContext) {
    const result = await this.object(this.grpc.assessmentExams.updateExam({ examId, body: toProtoStruct(body) }, this.metadata.build(req)));
    this.realtime.publishExamEvent(
      RealtimeRooms.exam(examId),
      AssessmentRealtimeEvents.examUpdated,
      result,
      this.getPublishContext(req),
    );
    return result;
  }

  @Delete(':examId')
  @ApiOperation({ summary: 'Delete exam' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  async deleteExam(@Param('examId') examId: string, @Req() req: RequestWithContext) {
    const result = await lastValueFrom(this.grpc.assessmentExams.deleteExam({ examId }, this.metadata.build(req)));
    this.realtime.publishExamEvent(
      RealtimeRooms.exam(examId),
      AssessmentRealtimeEvents.examDeleted,
      { id: examId, deleted: true },
      this.getPublishContext(req),
    );
    return result;
  }

  @Post(':examId/publish')
  @ApiOperation({ summary: 'Publish exam' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  async publishExam(@Param('examId') examId: string, @Req() req: RequestWithContext) {
    const result = await this.object(this.grpc.assessmentExams.publishExam({ examId }, this.metadata.build(req)));
    this.realtime.publishExamEvent(
      RealtimeRooms.exam(examId),
      AssessmentRealtimeEvents.examPublished,
      result,
      this.getPublishContext(req),
    );
    return result;
  }

  @Post(':examId/close')
  @ApiOperation({ summary: 'Close exam' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  async closeExam(@Param('examId') examId: string, @Req() req: RequestWithContext) {
    const result = await this.object(this.grpc.assessmentExams.closeExam({ examId }, this.metadata.build(req)));
    this.realtime.publishExamEvent(
      RealtimeRooms.exam(examId),
      AssessmentRealtimeEvents.examClosed,
      result,
      this.getPublishContext(req),
    );
    return result;
  }

  private async object(call: Observable<unknown>) {
    return unwrapObjectResponse(await lastValueFrom(call));
  }

  private getPublishContext(req: RequestWithContext) {
    return {
      requestId: req.context?.requestId,
      correlationId: req.context?.correlationId,
    };
  }
}

@ApiTags('Assessments')
@ApiBearerAuth()
@Controller('assessments')
export class AssessmentsGatewayController {
  constructor(
    private readonly grpc: BeCoreGrpcClientService,
    private readonly metadata: GrpcMetadataBuilder,
    private readonly realtime: RealtimePublisher,
  ) {}

  @Post('exams/:examId/questions')
  @ApiOperation({ summary: 'Create question' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  @ApiBody({ type: CreateQuestionDto })
  async createQuestion(@Param('examId') examId: string, @Body() body: CreateQuestionDto, @Req() req: RequestWithContext) {
    const result = await this.object(this.grpc.assessmentQuestions.createQuestion({ examId, body: toProtoStruct(body) }, this.metadata.build(req)));
    this.realtime.publishQuestionEvent(
      RealtimeRooms.exam(examId),
      AssessmentRealtimeEvents.questionCreated,
      result,
      this.getPublishContext(req),
    );
    return result;
  }

  @Get('exams/:examId/questions')
  @ApiOperation({ summary: 'Get exam questions' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  async getExamQuestions(@Param('examId') examId: string, @Req() req: RequestWithContext) {
    return unwrapListResponse(await lastValueFrom(this.grpc.assessmentQuestions.getExamQuestions({ examId }, this.metadata.build(req)))).items;
  }

  @Get('questions/:questionId')
  @ApiOperation({ summary: 'Get question detail' })
  @ApiParam({ name: 'questionId', format: 'uuid' })
  getQuestionDetail(@Param('questionId') questionId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentQuestions.getQuestionDetail({ questionId }, this.metadata.build(req)));
  }

  @Patch('questions/:questionId')
  @ApiOperation({ summary: 'Update question' })
  @ApiParam({ name: 'questionId', format: 'uuid' })
  @ApiBody({ type: UpdateQuestionDto })
  async updateQuestion(@Param('questionId') questionId: string, @Body() body: UpdateQuestionDto, @Req() req: RequestWithContext) {
    const result = await this.object(this.grpc.assessmentQuestions.updateQuestion({ questionId, body: toProtoStruct(body) }, this.metadata.build(req)));
    const examId = this.getStringField(result, 'examId');
    this.realtime.publishQuestionEvent(
      examId ? RealtimeRooms.exam(examId) : RealtimeRooms.user(this.getUserId(req)),
      AssessmentRealtimeEvents.questionUpdated,
      result,
      this.getPublishContext(req),
    );
    return result;
  }

  @Delete('questions/:questionId')
  @ApiOperation({ summary: 'Delete question' })
  @ApiParam({ name: 'questionId', format: 'uuid' })
  async deleteQuestion(@Param('questionId') questionId: string, @Req() req: RequestWithContext) {
    const result = await lastValueFrom(this.grpc.assessmentQuestions.deleteQuestion({ questionId }, this.metadata.build(req)));
    this.realtime.publishQuestionEvent(
      RealtimeRooms.user(this.getUserId(req)),
      AssessmentRealtimeEvents.questionDeleted,
      { id: questionId, deleted: true },
      this.getPublishContext(req),
    );
    return result;
  }

  @Post('questions/reorder')
  @ApiOperation({ summary: 'Reorder questions' })
  @ApiBody({ type: ReorderQuestionsDto })
  async reorderQuestions(@Body() body: ReorderQuestionsDto, @Req() req: RequestWithContext) {
    const result = await this.object(this.grpc.assessmentQuestions.reorderQuestions({ body: toProtoStruct(body) }, this.metadata.build(req)));
    this.realtime.publishQuestionEvent(
      RealtimeRooms.user(this.getUserId(req)),
      AssessmentRealtimeEvents.questionReordered,
      result,
      this.getPublishContext(req),
    );
    return result;
  }

  @Post('exams/:examId/start')
  @ApiOperation({ summary: 'Start exam attempt' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  async startExam(@Param('examId') examId: string, @Req() req: RequestWithContext) {
    const result = await this.object(this.grpc.assessmentSubmissions.startExam({ examId }, this.metadata.build(req)));
    const submissionId = this.getStringField(result, 'submissionId');
    this.realtime.publishSubmissionEvent(
      submissionId ? RealtimeRooms.submission(submissionId) : RealtimeRooms.exam(examId),
      AssessmentRealtimeEvents.submissionStarted,
      result,
      this.getPublishContext(req),
    );
    return result;
  }

  @Get('submissions/:submissionId')
  @ApiOperation({ summary: 'Get submission detail' })
  @ApiParam({ name: 'submissionId', format: 'uuid' })
  getSubmissionDetail(@Param('submissionId') submissionId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentSubmissions.getSubmissionDetail({ submissionId }, this.metadata.build(req)));
  }

  @Patch('submissions/:submissionId/answers')
  @ApiOperation({ summary: 'Autosave answers' })
  @ApiParam({ name: 'submissionId', format: 'uuid' })
  @ApiBody({ type: AnswersDto })
  async autosaveAnswers(@Param('submissionId') submissionId: string, @Body() body: AnswersDto, @Req() req: RequestWithContext) {
    const result = await this.object(this.grpc.assessmentSubmissions.autosaveAnswers({ submissionId, body: toProtoStruct(body) }, this.metadata.build(req)));
    this.realtime.publishSubmissionEvent(
      RealtimeRooms.submission(submissionId),
      AssessmentRealtimeEvents.submissionAnswersAutosaved,
      result,
      this.getPublishContext(req),
    );
    return result;
  }

  @Post('submissions/:submissionId/submit')
  @ApiOperation({ summary: 'Submit exam' })
  @ApiParam({ name: 'submissionId', format: 'uuid' })
  async submitSubmission(@Param('submissionId') submissionId: string, @Req() req: RequestWithContext) {
    const result = await this.object(this.grpc.assessmentSubmissions.submitSubmission({ submissionId }, this.metadata.build(req)));
    this.realtime.publishSubmissionEvent(
      RealtimeRooms.submission(submissionId),
      AssessmentRealtimeEvents.submissionSubmitted,
      result,
      this.getPublishContext(req),
    );
    return result;
  }

  @Get('results/:submissionId')
  @ApiOperation({ summary: 'Get exam result' })
  @ApiParam({ name: 'submissionId', format: 'uuid' })
  getResult(@Param('submissionId') submissionId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentResults.getResult({ submissionId }, this.metadata.build(req)));
  }

  @Post('results/:submissionId/manual-grade')
  @ApiOperation({ summary: 'Teacher manual grading' })
  @ApiParam({ name: 'submissionId', format: 'uuid' })
  @ApiBody({ type: ManualGradeDto })
  async manualGrade(@Param('submissionId') submissionId: string, @Body() body: ManualGradeDto, @Req() req: RequestWithContext) {
    const result = await this.object(this.grpc.assessmentResults.manualGrade({ submissionId, body: toProtoStruct(body) }, this.metadata.build(req)));
    this.realtime.publishResultEvent(
      RealtimeRooms.submission(submissionId),
      AssessmentRealtimeEvents.resultGraded,
      result,
      this.getPublishContext(req),
    );
    return result;
  }

  private async object(call: Observable<unknown>) {
    return unwrapObjectResponse(await lastValueFrom(call));
  }

  private getStringField(value: unknown, key: string): string | undefined {
    if (typeof value !== 'object' || value === null) {
      return undefined;
    }
    const field = (value as Record<string, unknown>)[key];
    return typeof field === 'string' ? field : undefined;
  }

  private getUserId(req: RequestWithContext): string {
    const userId = req.context?.userId;
    if (!userId) {
      throw new Error('Missing authenticated user context');
    }
    return userId;
  }

  private getPublishContext(req: RequestWithContext) {
    return {
      requestId: req.context?.requestId,
      correlationId: req.context?.correlationId,
    };
  }
}

@ApiTags('Assessments - Analytics')
@ApiBearerAuth()
@Controller('assessments/analytics')
export class AssessmentAnalyticsGatewayController {
  constructor(private readonly grpc: BeCoreGrpcClientService, private readonly metadata: GrpcMetadataBuilder) {}

  @Get('exams/:examId')
  @ApiOperation({ summary: 'Get exam analytics' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  getExamAnalytics(@Param('examId') examId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentAnalytics.getExamAnalytics({ examId }, this.metadata.build(req)));
  }

  @Get('exams/:examId/questions')
  @ApiOperation({ summary: 'Get question analytics' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  getQuestionAnalytics(@Param('examId') examId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentAnalytics.getQuestionAnalytics({ examId }, this.metadata.build(req)));
  }

  @Get('students/:studentId')
  @ApiOperation({ summary: 'Get student assessment analytics' })
  @ApiParam({ name: 'studentId' })
  getStudentAnalytics(@Param('studentId') studentId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentAnalytics.getStudentAnalytics({ studentId }, this.metadata.build(req)));
  }

  private async object(call: Observable<unknown>) {
    return unwrapObjectResponse(await lastValueFrom(call));
  }
}
