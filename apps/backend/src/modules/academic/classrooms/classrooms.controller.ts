import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
import { ClassroomsService } from './classrooms.service';
import { ClassInvitesDto } from '@edtech/contracts';
import { ClassroomQueryDto } from '@edtech/contracts';
import { CreateClassroomDto } from '@edtech/contracts';
import { UpdateClassroomDto } from '@edtech/contracts';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserPayload } from '../../../common/types/current-user.type';

@ApiTags('Academic - Classrooms')
@ApiBearerAuth()
@Controller()
export class ClassroomsController {
  constructor(private readonly classroomsService: ClassroomsService) {}

  @Post('classes/:classroomId/regenerate-invite-code')
  @ApiOperation({ summary: 'Regenerate classroom invite code' })
  @ApiParam({ name: 'classroomId', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Invite code regenerated successfully' })
  regenerateInviteCode(
    @Param('classroomId', ParseUUIDPipe) classroomId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.classroomsService.regenerateInviteCode(
      classroomId,
      user.id,
      user.roles,
    );
  }

  @Get('classes/:classroomId')
  @ApiOperation({ summary: 'Get classroom detail' })
  @ApiParam({ name: 'classroomId', format: 'uuid' })
  @ApiOkResponse({ description: 'Classroom detail returned successfully' })
  getClassroomDetail(
    @Param('classroomId', ParseUUIDPipe) classroomId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.classroomsService.getClassroomDetail(classroomId, user.id);
  }

  @Patch('classes/:classroomId')
  @ApiOperation({ summary: 'Update classroom' })
  @ApiParam({ name: 'classroomId', format: 'uuid' })
  @ApiBody({ type: UpdateClassroomDto })
  @ApiOkResponse({ description: 'Classroom updated successfully' })
  updateClassroom(
    @Param('classroomId', ParseUUIDPipe) classroomId: string,
    @Body() body: UpdateClassroomDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.classroomsService.updateClassroom(
      classroomId,
      body,
      user.id,
      user.roles,
    );
  }

  @Delete('classes/:classroomId')
  @ApiOperation({ summary: 'Delete classroom' })
  @ApiParam({ name: 'classroomId', format: 'uuid' })
  @ApiOkResponse({ description: 'Classroom deleted successfully' })
  deleteClassroom(
    @Param('classroomId', ParseUUIDPipe) classroomId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.classroomsService.deleteClassroom(
      classroomId,
      user.id,
      user.roles,
    );
  }

  @Get('classes')
  @ApiOperation({ summary: 'Get classes alias' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'courseId', required: false, format: 'uuid' })
  @ApiOkResponse({ description: 'Classes returned successfully' })
  getClasses(@Query() query: ClassroomQueryDto, @CurrentUser() user: CurrentUserPayload) {
    return this.classroomsService.getClassrooms(query, user.id, user.roles);
  }

  @Post('classes')
  @ApiOperation({ summary: 'Create class alias' })
  @ApiBody({ type: CreateClassroomDto })
  @ApiCreatedResponse({ description: 'Class created successfully' })
  createClass(@Body() body: CreateClassroomDto, @CurrentUser() user: CurrentUserPayload) {
    return this.classroomsService.createClassroom(body, user.id, user.roles);
  }

  @Post('classes/:classId/invites')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Invite class members' })
  @ApiParam({ name: 'classId', format: 'uuid' })
  @ApiBody({ type: ClassInvitesDto })
  @ApiAcceptedResponse({ description: 'Invite job queued successfully' })
  inviteClassMembers(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Body() body: ClassInvitesDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.classroomsService.inviteClassMembers(
      classId,
      body,
      user.id,
      user.roles,
    );
  }
}
