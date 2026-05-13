import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserPayload } from '../../../common/types/current-user.type';
import { AssessmentsSharedService } from '../shared/assessments-shared.service';

@ApiTags('Assessments - Analytics')
@ApiBearerAuth()
@Controller('assessments/analytics')
export class AnalyticsController {
  constructor(private readonly assessmentsService: AssessmentsSharedService) {}

  @Get('exams/:examId')
  @ApiOperation({ summary: 'Get exam analytics' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  @ApiOkResponse({ description: 'Exam analytics returned successfully' })
  getExamAnalytics(
    @Param('examId', ParseUUIDPipe) examId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assessmentsService.getExamAnalytics(examId, user.id, user.roles);
  }

  @Get('exams/:examId/questions')
  @ApiOperation({ summary: 'Get question analytics' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  @ApiOkResponse({ description: 'Question analytics returned successfully' })
  getQuestionAnalytics(
    @Param('examId', ParseUUIDPipe) examId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assessmentsService.getQuestionAnalytics(
      examId,
      user.id,
      user.roles,
    );
  }

  @Get('students/:studentId')
  @ApiOperation({ summary: 'Get student assessment analytics' })
  @ApiParam({ name: 'studentId' })
  @ApiOkResponse({ description: 'Student analytics returned successfully' })
  getStudentAnalytics(
    @Param('studentId') studentId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assessmentsService.getStudentAnalytics(
      studentId,
      user.id,
      user.roles,
    );
  }
}
