import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { lastValueFrom } from 'rxjs';
import { AnswersDto, CreateExamDto, CreateQuestionDto, ExamsQueryDto, ManualGradeDto, ReorderQuestionsDto, UpdateExamDto, UpdateQuestionDto } from '@edtech/contracts';
import { GrpcMetadataBuilder } from '../common/grpc-metadata/grpc-metadata.builder';
import { toProtoStruct, unwrapListResponse, unwrapObjectResponse, unwrapPageResponse } from '@edtech/contracts';
import { RequestWithContext } from '../common/types/request-with-context';
import { BeCoreGrpcClientService } from '../grpc-clients/be-core-grpc-client.service';

@ApiTags('Assessments - Exams')
@ApiBearerAuth()
@Controller('assessments/exams')
export class AssessmentExamsGatewayController {
  constructor(private readonly grpc: BeCoreGrpcClientService, private readonly metadata: GrpcMetadataBuilder) {}

  @Post()
  @ApiOperation({ summary: 'Create exam' })
  @ApiBody({ type: CreateExamDto })
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
  @ApiParam({ name: 'examId', format: 'uuid' })
  @ApiBody({ type: UpdateExamDto })
  updateExam(@Param('examId') examId: string, @Body() body: UpdateExamDto, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentExams.updateExam({ examId, body: toProtoStruct(body) }, this.metadata.build(req)));
  }

  @Delete(':examId')
  @ApiOperation({ summary: 'Delete exam' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  deleteExam(@Param('examId') examId: string, @Req() req: RequestWithContext) {
    return lastValueFrom(this.grpc.assessmentExams.deleteExam({ examId }, this.metadata.build(req)));
  }

  @Post(':examId/publish')
  @ApiOperation({ summary: 'Publish exam' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  publishExam(@Param('examId') examId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentExams.publishExam({ examId }, this.metadata.build(req)));
  }

  @Post(':examId/close')
  @ApiOperation({ summary: 'Close exam' })
  @ApiParam({ name: 'examId', format: 'uuid' })
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
  constructor(private readonly grpc: BeCoreGrpcClientService, private readonly metadata: GrpcMetadataBuilder) {}

  @Post('exams/:examId/questions')
  @ApiOperation({ summary: 'Create question' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  @ApiBody({ type: CreateQuestionDto })
  createQuestion(@Param('examId') examId: string, @Body() body: CreateQuestionDto, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentQuestions.createQuestion({ examId, body: toProtoStruct(body) }, this.metadata.build(req)));
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
  updateQuestion(@Param('questionId') questionId: string, @Body() body: UpdateQuestionDto, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentQuestions.updateQuestion({ questionId, body: toProtoStruct(body) }, this.metadata.build(req)));
  }

  @Delete('questions/:questionId')
  @ApiOperation({ summary: 'Delete question' })
  @ApiParam({ name: 'questionId', format: 'uuid' })
  deleteQuestion(@Param('questionId') questionId: string, @Req() req: RequestWithContext) {
    return lastValueFrom(this.grpc.assessmentQuestions.deleteQuestion({ questionId }, this.metadata.build(req)));
  }

  @Post('questions/reorder')
  @ApiOperation({ summary: 'Reorder questions' })
  @ApiBody({ type: ReorderQuestionsDto })
  reorderQuestions(@Body() body: ReorderQuestionsDto, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentQuestions.reorderQuestions({ body: toProtoStruct(body) }, this.metadata.build(req)));
  }

  @Post('exams/:examId/start')
  @ApiOperation({ summary: 'Start exam attempt' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  startExam(@Param('examId') examId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentSubmissions.startExam({ examId }, this.metadata.build(req)));
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
  autosaveAnswers(@Param('submissionId') submissionId: string, @Body() body: AnswersDto, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentSubmissions.autosaveAnswers({ submissionId, body: toProtoStruct(body) }, this.metadata.build(req)));
  }

  @Post('submissions/:submissionId/submit')
  @ApiOperation({ summary: 'Submit exam' })
  @ApiParam({ name: 'submissionId', format: 'uuid' })
  submitSubmission(@Param('submissionId') submissionId: string, @Req() req: RequestWithContext) {
    return this.object(this.grpc.assessmentSubmissions.submitSubmission({ submissionId }, this.metadata.build(req)));
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

  private async object(call: any) {
    return unwrapObjectResponse(await lastValueFrom(call));
  }
}
