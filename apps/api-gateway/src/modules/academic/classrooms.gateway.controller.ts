import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { lastValueFrom } from 'rxjs';
import { ClassInvitesDto, ClassroomQueryDto, CreateClassroomDto, UpdateClassroomDto } from '@edtech/contracts';
import { GrpcMetadataBuilder } from '../common/grpc-metadata/grpc-metadata.builder';
import { RequestWithContext } from '../common/types/request-with-context';
import { BeCoreGrpcClientService } from '../grpc-clients/be-core-grpc-client.service';

@ApiTags('Academic - Classrooms')
@ApiBearerAuth()
@Controller()
export class ClassroomsGatewayController {
  constructor(
    private readonly grpc: BeCoreGrpcClientService,
    private readonly metadataBuilder: GrpcMetadataBuilder,
  ) {}

  @Get('classes')
  @ApiOperation({ summary: 'Get classes' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'courseId', required: false, format: 'uuid' })
  @ApiOkResponse({ description: 'Classes returned successfully' })
  getClassrooms(@Query() query: ClassroomQueryDto, @Req() req: RequestWithContext) {
    return lastValueFrom(
      this.grpc.classrooms.getClassrooms(
        {
          page: Number(query.page) || undefined,
          limit: Number(query.limit) || undefined,
          courseId: query.courseId,
        },
        this.metadataBuilder.build(req),
      ),
    );
  }

  @Post('classes')
  @ApiOperation({ summary: 'Create class' })
  @ApiBody({ type: CreateClassroomDto })
  @ApiCreatedResponse({ description: 'Class created successfully' })
  createClassroom(@Body() body: CreateClassroomDto, @Req() req: RequestWithContext) {
    return lastValueFrom(
      this.grpc.classrooms.createClassroom(
        {
          courseId: body.courseId,
          name: body.name,
          inviteCode: body.inviteCode,
          startAt: body.startAt,
          endAt: body.endAt,
        },
        this.metadataBuilder.build(req),
      ),
    );
  }

  @Get('classes/:classroomId')
  @ApiOperation({ summary: 'Get classroom detail' })
  @ApiParam({ name: 'classroomId', format: 'uuid' })
  @ApiOkResponse({ description: 'Classroom detail returned successfully' })
  getClassroomDetail(
    @Param('classroomId') classroomId: string,
    @Req() req: RequestWithContext,
  ) {
    return lastValueFrom(
      this.grpc.classrooms.getClassroomDetail(
        { classroomId },
        this.metadataBuilder.build(req),
      ),
    );
  }

  @Patch('classes/:classroomId')
  @ApiOperation({ summary: 'Update classroom' })
  @ApiParam({ name: 'classroomId', format: 'uuid' })
  @ApiBody({ type: UpdateClassroomDto })
  @ApiOkResponse({ description: 'Classroom updated successfully' })
  updateClassroom(
    @Param('classroomId') classroomId: string,
    @Body() body: UpdateClassroomDto,
    @Req() req: RequestWithContext,
  ) {
    return lastValueFrom(
      this.grpc.classrooms.updateClassroom(
        {
          classroomId,
          name: body.name,
          startAt: body.startAt,
          endAt: body.endAt,
        },
        this.metadataBuilder.build(req),
      ),
    );
  }

  @Delete('classes/:classroomId')
  @ApiOperation({ summary: 'Delete classroom' })
  @ApiParam({ name: 'classroomId', format: 'uuid' })
  @ApiOkResponse({ description: 'Classroom deleted successfully' })
  deleteClassroom(
    @Param('classroomId') classroomId: string,
    @Req() req: RequestWithContext,
  ) {
    return lastValueFrom(
      this.grpc.classrooms.deleteClassroom(
        { classroomId },
        this.metadataBuilder.build(req),
      ),
    );
  }

  @Post('classes/:classroomId/regenerate-invite-code')
  @ApiOperation({ summary: 'Regenerate classroom invite code' })
  @ApiParam({ name: 'classroomId', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Invite code regenerated successfully' })
  regenerateInviteCode(
    @Param('classroomId') classroomId: string,
    @Req() req: RequestWithContext,
  ) {
    return lastValueFrom(
      this.grpc.classrooms.regenerateInviteCode(
        { classroomId },
        this.metadataBuilder.build(req),
      ),
    );
  }

  @Post('classes/:classId/invites')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Invite class members' })
  @ApiParam({ name: 'classId', format: 'uuid' })
  @ApiBody({ type: ClassInvitesDto })
  @ApiAcceptedResponse({ description: 'Invite job queued successfully' })
  inviteClassMembers(
    @Param('classId') classId: string,
    @Body() body: ClassInvitesDto,
    @Req() req: RequestWithContext,
  ) {
    return lastValueFrom(
      this.grpc.classrooms.inviteClassMembers(
        { classId, emails: body.emails ?? [] },
        this.metadataBuilder.build(req),
      ),
    );
  }
}
