import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserPayload } from '../../../common/types/current-user.type';
import { CreateEnrollmentDto } from '@edtech/contracts';
import { JoinClassroomDto } from '@edtech/contracts';
import { UpdateEnrollmentDto } from '@edtech/contracts';
import { EnrollmentsService } from './enrollments.service';

@ApiTags('Academic - Enrollments')
@ApiBearerAuth()
@Controller()
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post('enrollments/join')
  @ApiOperation({ summary: 'Join classroom by invite code' })
  @ApiBody({ type: JoinClassroomDto })
  @ApiCreatedResponse({ description: 'Joined classroom successfully' })
  joinClassroom(
    @Body() body: JoinClassroomDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.enrollmentsService.joinClassroom(body, user.id);
  }

  @Post('enrollments')
  @ApiOperation({ summary: 'Add student to classroom' })
  @ApiBody({ type: CreateEnrollmentDto })
  @ApiCreatedResponse({ description: 'Enrollment created successfully' })
  createEnrollment(
    @Body() body: CreateEnrollmentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.enrollmentsService.createEnrollment(body, user.id, user.roles);
  }

  @Get('classrooms/:classroomId/students')
  @ApiOperation({ summary: 'Get classroom students' })
  @ApiParam({ name: 'classroomId', format: 'uuid' })
  @ApiOkResponse({ description: 'Classroom students returned successfully' })
  getClassroomStudents(
    @Param('classroomId', ParseUUIDPipe) classroomId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.enrollmentsService.getClassroomStudents(
      classroomId,
      user.id,
      user.roles,
    );
  }

  @Patch('enrollments/:enrollmentId')
  @ApiOperation({ summary: 'Update enrollment role' })
  @ApiParam({ name: 'enrollmentId', format: 'uuid' })
  @ApiBody({ type: UpdateEnrollmentDto })
  @ApiOkResponse({ description: 'Enrollment updated successfully' })
  updateEnrollmentRole(
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @Body() body: UpdateEnrollmentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.enrollmentsService.updateEnrollmentRole(
      enrollmentId,
      body,
      user.id,
      user.roles,
    );
  }

  @Delete('enrollments/:enrollmentId')
  @ApiOperation({ summary: 'Remove student from classroom' })
  @ApiParam({ name: 'enrollmentId', format: 'uuid' })
  @ApiOkResponse({ description: 'Enrollment removed successfully' })
  removeEnrollment(
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.enrollmentsService.removeEnrollment(
      enrollmentId,
      user.id,
      user.roles,
    );
  }
}
