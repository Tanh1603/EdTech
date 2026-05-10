import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
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
import { lastValueFrom } from 'rxjs';
import { GrpcMetadataBuilder } from '../common/grpc-metadata/grpc-metadata.builder';
import { RequestWithContext } from '../common/types/request-with-context';
import { AcademicGrpcClientService } from '../grpc-clients/academic-grpc-client.service';

@ApiTags('Academic - Enrollments')
@ApiBearerAuth()
@Controller()
export class EnrollmentsGatewayController {
  constructor(
    private readonly academicGrpc: AcademicGrpcClientService,
    private readonly metadataBuilder: GrpcMetadataBuilder,
  ) {}

  @Post('enrollments/join')
  @ApiOperation({ summary: 'Join classroom by invite code' })
  @ApiBody({ schema: { type: 'object' } })
  @ApiCreatedResponse({ description: 'Joined classroom successfully' })
  joinClassroom(@Body() body: any, @Req() req: RequestWithContext) {
    return lastValueFrom(
      this.academicGrpc.enrollments.joinClassroom(
        { inviteCode: body.inviteCode, userId: req.user?.id },
        this.metadataBuilder.build(req),
      ),
    );
  }

  @Post('enrollments')
  @ApiOperation({ summary: 'Add student to classroom' })
  @ApiBody({ schema: { type: 'object' } })
  @ApiCreatedResponse({ description: 'Enrollment created successfully' })
  createEnrollment(@Body() body: any, @Req() req: RequestWithContext) {
    return lastValueFrom(
      this.academicGrpc.enrollments.createEnrollment(
        {
          classId: body.classId,
          userId: body.userId,
          role: body.role,
        },
        this.metadataBuilder.build(req),
      ),
    );
  }

  @Get('classrooms/:classroomId/students')
  @ApiOperation({ summary: 'Get classroom students' })
  @ApiParam({ name: 'classroomId', format: 'uuid' })
  @ApiOkResponse({ description: 'Classroom students returned successfully' })
  async getClassroomStudents(
    @Param('classroomId') classroomId: string,
    @Req() req: RequestWithContext,
  ) {
    const response = await lastValueFrom(
      this.academicGrpc.enrollments.getClassroomStudents(
        { classroomId },
        this.metadataBuilder.build(req),
      ),
    );
    return response.items ?? [];
  }

  @Patch('enrollments/:enrollmentId')
  @ApiOperation({ summary: 'Update enrollment role' })
  @ApiParam({ name: 'enrollmentId', format: 'uuid' })
  @ApiBody({ schema: { type: 'object' } })
  @ApiOkResponse({ description: 'Enrollment updated successfully' })
  updateEnrollmentRole(
    @Param('enrollmentId') enrollmentId: string,
    @Body() body: any,
    @Req() req: RequestWithContext,
  ) {
    return lastValueFrom(
      this.academicGrpc.enrollments.updateEnrollmentRole(
        { enrollmentId, role: body.role },
        this.metadataBuilder.build(req),
      ),
    );
  }

  @Delete('enrollments/:enrollmentId')
  @ApiOperation({ summary: 'Remove student from classroom' })
  @ApiParam({ name: 'enrollmentId', format: 'uuid' })
  @ApiOkResponse({ description: 'Enrollment removed successfully' })
  removeEnrollment(
    @Param('enrollmentId') enrollmentId: string,
    @Req() req: RequestWithContext,
  ) {
    return lastValueFrom(
      this.academicGrpc.enrollments.removeEnrollment(
        { enrollmentId },
        this.metadataBuilder.build(req),
      ),
    );
  }
}
