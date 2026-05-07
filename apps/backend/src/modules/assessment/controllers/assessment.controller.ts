import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { GenerateExamDto } from '../dto/generate-exam.dto';
import { OverrideResultDto } from '../dto/override-result.dto';
import { ResultsQueryDto } from '../dto/results-query.dto';
import { StartAttemptDto } from '../dto/start-attempt.dto';
import { SubmitAttemptDto } from '../dto/submit-attempt.dto';
import { UpdateExamDto } from '../dto/update-exam.dto';
import { AssessmentService } from '../services/assessment.service';
import { User } from '@clerk/backend';

@Controller()
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post('exams/generate')
  generateExam(@Body() payload: GenerateExamDto, @CurrentUser() user: User) {
    return this.assessmentService.generateExam(payload, user.id);
  }

  @Put('exams/:examId')
  updateExam(
    @Param('examId', ParseUUIDPipe) examId: string,
    @Body() payload: UpdateExamDto,
  ) {
    return this.assessmentService.updateExam(examId, payload);
  }

  @Post('exams/:examId/publish')
  publishExam(@Param('examId', ParseUUIDPipe) examId: string) {
    return this.assessmentService.publishExam(examId);
  }

  @Post('exams/:examId/attempts')
  startAttempt(
    @Param('examId', ParseUUIDPipe) examId: string,
    @Body() payload: StartAttemptDto,
  ) {
    return this.assessmentService.startAttempt(examId, payload);
  }

  @Post('attempts/:attemptId/submit')
  submitAttempt(
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Body() payload: SubmitAttemptDto,
  ) {
    return this.assessmentService.submitAttempt(attemptId, payload);
  }

  @Get('results')
  getResults(@Query() query: ResultsQueryDto) {
    return this.assessmentService.getResults(query);
  }

  @Post('results/:resultId/override')
  overrideResult(
    @Param('resultId', ParseUUIDPipe) resultId: string,
    @Body() payload: OverrideResultDto,
  ) {
    return this.assessmentService.overrideResult(resultId, payload);
  }
}

