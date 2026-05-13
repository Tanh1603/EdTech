import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CourseQueryDto } from '@edtech/contracts';
import { CreateCourseDto } from '@edtech/contracts';
import { UpdateCourseDto } from '@edtech/contracts';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserPayload } from '../../../common/types/current-user.type';
import { CoursesService } from './courses.service';

@ApiTags('Academic - Courses')
@ApiBearerAuth()
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'Get courses' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'math' })
  @ApiQuery({
    name: 'teacherId',
    required: false,
    type: String,
    example: 'teacher_123',
  })
  @ApiOkResponse({ description: 'Courses returned successfully' })
  getCourses(@Query() query: CourseQueryDto, @CurrentUser() user: CurrentUserPayload) {
    return this.coursesService.getCourses(query, user.id, user.roles);
  }

  @Post()
  @ApiOperation({ summary: 'Create course' })
  @ApiBody({ type: CreateCourseDto })
  @ApiCreatedResponse({ description: 'Course created successfully' })
  createCourse(@Body() body: CreateCourseDto, @CurrentUser() user: CurrentUserPayload) {
    return this.coursesService.createCourse(body, user.id, user.roles);
  }

  @Get(':courseId')
  @ApiOperation({ summary: 'Get course detail' })
  @ApiParam({ name: 'courseId', format: 'uuid' })
  @ApiOkResponse({ description: 'Course detail returned successfully' })
  getCourseDetail(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.coursesService.getCourseDetail(courseId, user.id, user.roles);
  }

  @Patch(':courseId')
  @ApiOperation({ summary: 'Update course' })
  @ApiParam({ name: 'courseId', format: 'uuid' })
  @ApiBody({ type: UpdateCourseDto })
  @ApiOkResponse({ description: 'Course updated successfully' })
  updateCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() body: UpdateCourseDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.coursesService.updateCourse(courseId, body, user.id, user.roles);
  }

  @Delete(':courseId')
  @ApiOperation({ summary: 'Delete course' })
  @ApiParam({ name: 'courseId', format: 'uuid' })
  @ApiOkResponse({ description: 'Course deleted successfully' })
  deleteCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.coursesService.deleteCourse(courseId, user.id, user.roles);
  }
}
