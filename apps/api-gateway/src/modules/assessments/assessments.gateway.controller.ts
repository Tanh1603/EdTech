import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { lastValueFrom } from 'rxjs';
import { AnswersDto, CreateExamDto, CreateQuestionDto, ExamsQueryDto, ManualGradeDto, ReorderQuestionsDto, UpdateExamDto, UpdateQuestionDto } from '@edtech/contracts';
import { GrpcMetadataBuilder } from '../common/grpc-metadata/grpc-metadata.builder';
import { toProtoStruct, unwrapListResponse, unwrapObjectResponse, unwrapPageResponse } from '@edtech/contracts';
import { RequestWithContext } from '../common/types/request-with-context';
import { CoreGrpcClientService } from '../grpc-clients/core-grpc-client.service';

@ApiTags('Assessments - Exams')
@ApiBearerAuth()
@Controller('assessments/exams')
export class AssessmentExamsGatewayController {
  constructor(private readonly grpc: CoreGrpcClientService, private readonly metadata: GrpcMetadataBuilder) {}

  @Post()
  @ApiOperation({ summary: 'Create exam' })
  @ApiBody({ schema: { type: 'object' } })
  createExam(@Body() body: CreateExamDto, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentExams.createExam({ body: toProtoStruct(body) }, this.metadata.build(req)));
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
  @ApiBody({ schema: { type: 'object' } })
  updateExam(@Param('examId') examId: string, @Body() body: UpdateExamDto, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentExams.updateExam({ examId, body: toProtoStruct(body) }, this.metadata.build(req)));
  }

  @Delete(':examId')
  @ApiOperation({ summary: 'Delete exam' })
  deleteExam(@Param('examId') examId: string, @Req() req: RequestWithContext) {
    return lastValueFrom(this.grpc.assessmentExams.deleteExam({ examId }, this.metadata.build(req)));
  }

  @Post(':examId/publish')
  @ApiOperation({ summary: 'Publish exam' })
  publishExam(@Param('examId') examId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentExams.publishExam({ examId }, this.metadata.build(req)));
  }

  @Post(':examId/close')
  @ApiOperation({ summary: 'Close exam' })
  closeExam(@Param('examId') examId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentExams.closeExam({ examId }, this.metadata.build(req)));
  }

  private async object(call: any) {
    return unwrapObjectResponse(await lastValueFrom(call));
  }
}

@ApiTags('Assessments')
@ApiBearerAuth()
@Controller('assessments')
export class AssessmentsGatewayController {
  constructor(private readonly grpc: CoreGrpcClientService, private readonly metadata: GrpcMetadataBuilder) {}

  @Post('exams/:examId/questions')
  @ApiOperation({ summary: 'Create question' })
  @ApiBody({ schema: { type: 'object' } })
  createQuestion(@Param('examId') examId: string, @Body() body: CreateQuestionDto, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentQuestions.createQuestion({ examId, body: toProtoStruct(body) }, this.metadata.build(req)));
  }

  @Get('exams/:examId/questions')
  @ApiOperation({ summary: 'Get exam questions' })
  async getExamQuestions(@Param('examId') examId: string, @Req() req: RequestWithContext) {
    return unwrapListResponse(await lastValueFrom(this.grpc.assessmentQuestions.getExamQuestions({ examId }, this.metadata.build(req)))).items;
  }

  @Get('questions/:questionId')
  @ApiOperation({ summary: 'Get question detail' })
  getQuestionDetail(@Param('questionId') questionId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentQuestions.getQuestionDetail({ questionId }, this.metadata.build(req)));
  }

  @Patch('questions/:questionId')
  @ApiOperation({ summary: 'Update question' })
  @ApiBody({ schema: { type: 'object' } })
  updateQuestion(@Param('questionId') questionId: string, @Body() body: UpdateQuestionDto, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentQuestions.updateQuestion({ questionId, body: toProtoStruct(body) }, this.metadata.build(req)));
  }

  @Delete('questions/:questionId')
  @ApiOperation({ summary: 'Delete question' })
  deleteQuestion(@Param('questionId') questionId: string, @Req() req: RequestWithContext) {
    return lastValueFrom(this.grpc.assessmentQuestions.deleteQuestion({ questionId }, this.metadata.build(req)));
  }

  @Post('questions/reorder')
  @ApiOperation({ summary: 'Reorder questions' })
  @ApiBody({ schema: { type: 'object' } })
  reorderQuestions(@Body() body: ReorderQuestionsDto, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentQuestions.reorderQuestions({ body: toProtoStruct(body) }, this.metadata.build(req)));
  }

  @Post('exams/:examId/start')
  @ApiOperation({ summary: 'Start exam attempt' })
  startExam(@Param('examId') examId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentSubmissions.startExam({ examId }, this.metadata.build(req)));
  }

  @Get('submissions/:submissionId')
  @ApiOperation({ summary: 'Get submission detail' })
  getSubmissionDetail(@Param('submissionId') submissionId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentSubmissions.getSubmissionDetail({ submissionId }, this.metadata.build(req)));
  }

  @Patch('submissions/:submissionId/answers')
  @ApiOperation({ summary: 'Autosave answers' })
  @ApiBody({ schema: { type: 'object' } })
  autosaveAnswers(@Param('submissionId') submissionId: string, @Body() body: AnswersDto, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentSubmissions.autosaveAnswers({ submissionId, body: toProtoStruct(body) }, this.metadata.build(req)));
  }

  @Post('submissions/:submissionId/submit')
  @ApiOperation({ summary: 'Submit exam' })
  submitSubmission(@Param('submissionId') submissionId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentSubmissions.submitSubmission({ submissionId }, this.metadata.build(req)));
  }

  @Get('results/:submissionId')
  @ApiOperation({ summary: 'Get exam result' })
  getResult(@Param('submissionId') submissionId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentResults.getResult({ submissionId }, this.metadata.build(req)));
  }

  @Post('results/:submissionId/manual-grade')
  @ApiOperation({ summary: 'Teacher manual grading' })
  @ApiBody({ schema: { type: 'object' } })
  manualGrade(@Param('submissionId') submissionId: string, @Body() body: ManualGradeDto, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentResults.manualGrade({ submissionId, body: toProtoStruct(body) }, this.metadata.build(req)));
  }

  private async object(call: any) {
    return unwrapObjectResponse(await lastValueFrom(call));
  }
}

@ApiTags('Assessments - Analytics')
@ApiBearerAuth()
@Controller('assessments/analytics')
export class AssessmentAnalyticsGatewayController {
  constructor(private readonly grpc: CoreGrpcClientService, private readonly metadata: GrpcMetadataBuilder) {}

  @Get('exams/:examId')
  @ApiOperation({ summary: 'Get exam analytics' })
  getExamAnalytics(@Param('examId') examId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentAnalytics.getExamAnalytics({ examId }, this.metadata.build(req)));
  }

  @Get('exams/:examId/questions')
  @ApiOperation({ summary: 'Get question analytics' })
  getQuestionAnalytics(@Param('examId') examId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentAnalytics.getQuestionAnalytics({ examId }, this.metadata.build(req)));
  }

  @Get('students/:studentId')
  @ApiOperation({ summary: 'Get student assessment analytics' })
  getStudentAnalytics(@Param('studentId') studentId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentAnalytics.getStudentAnalytics({ studentId }, this.metadata.build(req)));
  }

  private async object(call: any) {
    return unwrapObjectResponse(await lastValueFrom(call));
  }
}
