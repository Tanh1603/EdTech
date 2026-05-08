import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
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
  getExamAnalytics(@Param('examId', ParseUUIDPipe) examId: string) {
    return this.assessmentsService.getExamAnalytics(examId);
  }

  @Get('exams/:examId/questions')
  @ApiOperation({ summary: 'Get question analytics' })
  @ApiParam({ name: 'examId', format: 'uuid' })
  @ApiOkResponse({ description: 'Question analytics returned successfully' })
  getQuestionAnalytics(@Param('examId', ParseUUIDPipe) examId: string) {
    return this.assessmentsService.getQuestionAnalytics(examId);
  }

  @Get('students/:studentId')
  @ApiOperation({ summary: 'Get student assessment analytics' })
  @ApiParam({ name: 'studentId' })
  @ApiOkResponse({ description: 'Student analytics returned successfully' })
  getStudentAnalytics(@Param('studentId') studentId: string) {
    return this.assessmentsService.getStudentAnalytics(studentId);
  }
}
