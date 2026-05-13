import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserPayload } from '../../../common/types/current-user.type';
import { AssessmentsSharedService } from '../shared/assessments-shared.service';
import { ManualGradeDto } from '@edtech/contracts';

@ApiTags('Assessments - Results')
@ApiBearerAuth()
@Controller('assessments')
export class ResultsController {
  constructor(private readonly assessmentsService: AssessmentsSharedService) {}

  @Get('results/:submissionId')
  @ApiOperation({ summary: 'Get exam result' })
  @ApiParam({ name: 'submissionId', format: 'uuid' })
  @ApiOkResponse({ description: 'Result returned successfully' })
  getResult(
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assessmentsService.getResult(submissionId, user.id, user.roles);
  }

  @Post('results/:submissionId/manual-grade')
  @ApiOperation({ summary: 'Teacher manual grading' })
  @ApiParam({ name: 'submissionId', format: 'uuid' })
  @ApiBody({ type: ManualGradeDto })
  manualGrade(
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @Body() body: ManualGradeDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assessmentsService.manualGrade(
      submissionId,
      body,
      user.id,
      user.roles,
    );
  }

}
