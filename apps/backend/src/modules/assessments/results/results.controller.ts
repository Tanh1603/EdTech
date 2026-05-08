import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AssessmentsSharedService } from '../shared/assessments-shared.service';
import { ManualGradeDto } from '../shared/dto/submission.dto';

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

  @Post('results/:submissionId/manual-grade')
  @ApiOperation({ summary: 'Teacher manual grading' })
  @ApiParam({ name: 'submissionId', format: 'uuid' })
  @ApiBody({ type: ManualGradeDto })
  manualGrade(@Param('submissionId', ParseUUIDPipe) submissionId: string, @Body() body: ManualGradeDto) {
    return this.assessmentsService.manualGrade(submissionId, body);
  }

}
