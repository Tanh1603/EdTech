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
import {
  CreateEnrollmentDto,
  JoinClassroomDto,
  unwrapListResponse,
  unwrapObjectResponse,
  UpdateEnrollmentDto,
} from '@edtech/contracts';
import { GrpcMetadataBuilder } from '../common/grpc-metadata/grpc-metadata.builder';
import { RequestWithContext } from '../common/types/request-with-context';
import { BeCoreGrpcClientService } from '../grpc-clients/be-core-grpc-client.service';

@ApiTags('Academic - Enrollments')
@ApiBearerAuth()
@Controller()
export class EnrollmentsGatewayController {
  constructor(
    private readonly grpc: BeCoreGrpcClientService,
    private readonly metadataBuilder: GrpcMetadataBuilder,
  ) {}

  @Post('enrollments/join')
  @ApiOperation({ summary: 'Join classroom by invite code' })
  @ApiBody({ type: JoinClassroomDto })
  @ApiCreatedResponse({ description: 'Joined classroom successfully' })
  async joinClassroom(@Body() body: JoinClassroomDto, @Req() req: RequestWithContext) {
    return unwrapObjectResponse(await lastValueFrom(
      this.grpc.enrollments.joinClassroom(
        { inviteCode: body.inviteCode, userId: req.user?.id },
        this.metadataBuilder.build(req),
      ),
    ));
  }

  @Post('enrollments')
  @ApiOperation({ summary: 'Add student to classroom' })
  @ApiBody({ type: CreateEnrollmentDto })
  @ApiCreatedResponse({ description: 'Enrollment created successfully' })
  async createEnrollment(@Body() body: CreateEnrollmentDto, @Req() req: RequestWithContext) {
    return unwrapObjectResponse(await lastValueFrom(
      this.grpc.enrollments.createEnrollment(
        {
          classId: body.classId,
          userId: body.userId,
          role: body.role,
        },
        this.metadataBuilder.build(req),
      ),
    ));
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
      this.grpc.enrollments.getClassroomStudents(
        { classroomId },
        this.metadataBuilder.build(req),
      ),
    );
    return unwrapListResponse(response).items;
  }

  @Patch('enrollments/:enrollmentId')
  @ApiOperation({ summary: 'Update enrollment role' })
  @ApiParam({ name: 'enrollmentId', format: 'uuid' })
  @ApiBody({ type: UpdateEnrollmentDto })
  @ApiOkResponse({ description: 'Enrollment updated successfully' })
  async updateEnrollmentRole(
    @Param('enrollmentId') enrollmentId: string,
    @Body() body: UpdateEnrollmentDto,
    @Req() req: RequestWithContext,
  ) {
    return unwrapObjectResponse(await lastValueFrom(
      this.grpc.enrollments.updateEnrollmentRole(
        { enrollmentId, role: body.role },
        this.metadataBuilder.build(req),
      ),
    ));
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
      this.grpc.enrollments.removeEnrollment(
        { enrollmentId },
        this.metadataBuilder.build(req),
      ),
    );
  }
}
