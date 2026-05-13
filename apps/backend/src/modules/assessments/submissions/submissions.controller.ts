import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserPayload } from '../../../common/types/current-user.type';
import { AssessmentsSharedService } from '../shared/assessments-shared.service';
import { AnswersDto } from '@edtech/contracts';

@ApiTags('Assessments - Submissions')
@ApiBearerAuth()
@Controller('assessments')
export class SubmissionsController {
  constructor(private readonly assessmentsService: AssessmentsSharedService) {}

  @Post('exams/:examId/start')
  @ApiOperation({ summary: 'Start exam attempt' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  startExam(@Param('examId', ParseUUIDPipe) examId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.assessmentsService.startExam(examId, user.id);
  }

  @Get('submissions/:submissionId')
  @ApiOperation({ summary: 'Get submission detail' })
  @ApiParam({ name: 'submissionId', format: 'uuid' })
  @ApiOkResponse({ description: 'Submission detail returned successfully' })
  getSubmissionDetail(
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assessmentsService.getSubmissionDetail(
      submissionId,
      user.id,
      user.roles,
    );
  }

  @Patch('submissions/:submissionId/answers')
  @ApiOperation({ summary: 'Autosave answers' })
  @ApiParam({ name: 'submissionId', format: 'uuid' })
  @ApiBody({ type: AnswersDto })
  autosaveAnswers(
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @Body() body: AnswersDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assessmentsService.autosaveAnswers(
      submissionId,
      body,
      user.id,
      user.roles,
    );
  }

  @Post('submissions/:submissionId/submit')
  @ApiOperation({ summary: 'Submit exam' })
  @ApiParam({ name: 'submissionId', format: 'uuid' })
  submitSubmission(
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assessmentsService.submitSubmission(
      submissionId,
      user.id,
      user.roles,
    );
  }
}
