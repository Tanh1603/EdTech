import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AssessmentsSharedService } from '../shared/assessments-shared.service';
import { AiGradingDto, ManualGradeDto } from '../shared/dto/submission.dto';

@ApiTags('Assessments - Results')
@ApiBearerAuth()
@Controller('assessments')
export class ResultsController {
  constructor(private readonly assessmentsService: AssessmentsSharedService) {}

  @Get('results/:submissionId')
  @ApiOperation({ summary: 'Get exam result' })
  @ApiParam({ name: 'submissionId', format: 'uuid' })
  @ApiOkResponse({ description: 'Result returned successfully' })
  getResult(@Param('submissionId', ParseUUIDPipe) submissionId: string) {
    return this.assessmentsService.getResult(submissionId);
  }

  @Post('results/:submissionId/regrade')
  @ApiOperation({ summary: 'Regrade submission' })
  @ApiParam({ name: 'submissionId', format: 'uuid' })
  regradeSubmission(@Param('submissionId', ParseUUIDPipe) submissionId: string) {
    return this.assessmentsService.regradeSubmission(submissionId);
  }

  @Post('results/:submissionId/manual-grade')
  @ApiOperation({ summary: 'Teacher manual grading' })
  @ApiParam({ name: 'submissionId', format: 'uuid' })
  @ApiBody({ type: ManualGradeDto })
  manualGrade(@Param('submissionId', ParseUUIDPipe) submissionId: string, @Body() body: ManualGradeDto) {
    return this.assessmentsService.manualGrade(submissionId, body);
  }

  @Post('ai-grading/submissions/:submissionId')
  @ApiOperation({ summary: 'Trigger AI grading' })
  @ApiParam({ name: 'submissionId', format: 'uuid' })
  triggerAiGrading(@Param('submissionId', ParseUUIDPipe) submissionId: string) {
    return this.assessmentsService.triggerAiGrading(submissionId);
  }

  @Post('ai-grading')
  @ApiOperation({ summary: 'Trigger AI grading by body' })
  @ApiBody({ type: AiGradingDto })
  triggerAiGradingByBody(@Body() body: AiGradingDto) {
    return this.assessmentsService.triggerAiGrading(body.submissionId);
  }

  @Get('ai-grading/jobs/:jobId')
  @ApiOperation({ summary: 'Get grading job status' })
  @ApiParam({ name: 'jobId', format: 'uuid' })
  getGradingJob(@Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.assessmentsService.getGradingJob(jobId);
  }
}
