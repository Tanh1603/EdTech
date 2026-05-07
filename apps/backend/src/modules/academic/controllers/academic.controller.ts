import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ClassInvitesDto } from '../dto/class-invites.dto';
import { CreateClassDto } from '../dto/create-class.dto';
import { CreateCourseDto } from '../dto/create-course.dto';
import { AcademicService } from '../services/academic.service';

@Controller()
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  @Get('courses')
  getCourses(@Query() query: PaginationQueryDto) {
    return this.academicService.getCourses(query.page ?? 1, query.limit ?? 20);
  }

  @Post('courses')
  createCourse(@Body() body: CreateCourseDto) {
    return this.academicService.createCourse(body);
  }

  @Get('classes')
  getClasses(@Query() query: PaginationQueryDto) {
    return this.academicService.getClasses(query.page ?? 1, query.limit ?? 20);
  }

  @Post('classes')
  createClass(@Body() body: CreateClassDto) {
    return this.academicService.createClass(body);
  }

  @Post('classes/:classId/invites')
  @HttpCode(HttpStatus.ACCEPTED)
  inviteClassMembers(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Body() body: ClassInvitesDto,
  ) {
    return this.academicService.inviteClassMembers(classId, body);
  }
}
