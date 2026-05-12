import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserPayload } from '../../../common/types/current-user.type';
import { AssessmentsSharedService } from '../shared/assessments-shared.service';
import { CreateQuestionDto, ReorderQuestionsDto, UpdateQuestionDto } from '@edtech/contracts';

@ApiTags('Assessments - Questions')
@ApiBearerAuth()
@Controller('assessments')
export class QuestionsController {
  constructor(private readonly assessmentsService: AssessmentsSharedService) {}

  @Post('exams/:examId/questions')
  @ApiOperation({ summary: 'Create question' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  @ApiBody({ type: CreateQuestionDto })
  createQuestion(
    @Param('examId', ParseUUIDPipe) examId: string,
    @Body() body: CreateQuestionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assessmentsService.createQuestion(examId, body, user.id);
  }

  @Get('exams/:examId/questions')
  @ApiOperation({ summary: 'Get exam questions' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  @ApiOkResponse({ description: 'Questions returned successfully' })
  getExamQuestions(
    @Param('examId', ParseUUIDPipe) examId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assessmentsService.getExamQuestions(examId, user.id);
  }

  @Get('questions/:questionId')
  @ApiOperation({ summary: 'Get question detail' })
  @ApiParam({ name: 'questionId', format: 'uuid' })
  getQuestionDetail(
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assessmentsService.getQuestionDetail(questionId, user.id);
  }

  @Patch('questions/:questionId')
  @ApiOperation({ summary: 'Update question' })
  @ApiParam({ name: 'questionId', format: 'uuid' })
  @ApiBody({ type: UpdateQuestionDto })
  updateQuestion(
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() body: UpdateQuestionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assessmentsService.updateQuestion(questionId, body, user.id);
  }

  @Delete('questions/:questionId')
  @ApiOperation({ summary: 'Delete question' })
  @ApiParam({ name: 'questionId', format: 'uuid' })
  deleteQuestion(
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assessmentsService.deleteQuestion(questionId, user.id);
  }

  @Post('questions/reorder')
  @ApiOperation({ summary: 'Reorder questions' })
  @ApiBody({ type: ReorderQuestionsDto })
  reorderQuestions(
    @Body() body: ReorderQuestionsDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assessmentsService.reorderQuestions(body, user.id);
  }
}
