import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AssessmentsSharedService } from '../shared/assessments-shared.service';
import { CreateQuestionDto, ReorderQuestionsDto, UpdateQuestionDto } from '../shared/dto/question.dto';

@ApiTags('Assessments - Questions')
@ApiBearerAuth()
@Controller('assessments')
export class QuestionsController {
  constructor(private readonly assessmentsService: AssessmentsSharedService) {}

  @Post('exams/:examId/questions')
  @ApiOperation({ summary: 'Create question' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  @ApiBody({ type: CreateQuestionDto })
  createQuestion(@Param('examId', ParseUUIDPipe) examId: string, @Body() body: CreateQuestionDto) {
    return this.assessmentsService.createQuestion(examId, body);
  }

  @Get('exams/:examId/questions')
  @ApiOperation({ summary: 'Get exam questions' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  @ApiOkResponse({ description: 'Questions returned successfully' })
  getExamQuestions(@Param('examId', ParseUUIDPipe) examId: string) {
    return this.assessmentsService.getExamQuestions(examId);
  }

  @Get('questions/:questionId')
  @ApiOperation({ summary: 'Get question detail' })
  @ApiParam({ name: 'questionId', format: 'uuid' })
  getQuestionDetail(@Param('questionId', ParseUUIDPipe) questionId: string) {
    return this.assessmentsService.getQuestionDetail(questionId);
  }

  @Patch('questions/:questionId')
  @ApiOperation({ summary: 'Update question' })
  @ApiParam({ name: 'questionId', format: 'uuid' })
  @ApiBody({ type: UpdateQuestionDto })
  updateQuestion(@Param('questionId', ParseUUIDPipe) questionId: string, @Body() body: UpdateQuestionDto) {
    return this.assessmentsService.updateQuestion(questionId, body);
  }

  @Delete('questions/:questionId')
  @ApiOperation({ summary: 'Delete question' })
  @ApiParam({ name: 'questionId', format: 'uuid' })
  deleteQuestion(@Param('questionId', ParseUUIDPipe) questionId: string) {
    return this.assessmentsService.deleteQuestion(questionId);
  }

  @Post('questions/reorder')
  @ApiOperation({ summary: 'Reorder questions' })
  @ApiBody({ type: ReorderQuestionsDto })
  reorderQuestions(@Body() body: ReorderQuestionsDto) {
    return this.assessmentsService.reorderQuestions(body);
  }
}
