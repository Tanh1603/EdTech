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
  getCourses(@Query() query: CourseQueryDto) {
    return this.coursesService.getCourses(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create course' })
  @ApiBody({ type: CreateCourseDto })
  @ApiCreatedResponse({ description: 'Course created successfully' })
  createCourse(@Body() body: CreateCourseDto) {
    return this.coursesService.createCourse(body);
  }

  @Get(':courseId')
  @ApiOperation({ summary: 'Get course detail' })
  @ApiParam({ name: 'courseId', format: 'uuid' })
  @ApiOkResponse({ description: 'Course detail returned successfully' })
  getCourseDetail(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.coursesService.getCourseDetail(courseId);
  }

  @Patch(':courseId')
  @ApiOperation({ summary: 'Update course' })
  @ApiParam({ name: 'courseId', format: 'uuid' })
  @ApiBody({ type: UpdateCourseDto })
  @ApiOkResponse({ description: 'Course updated successfully' })
  updateCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() body: UpdateCourseDto,
  ) {
    return this.coursesService.updateCourse(courseId, body);
  }

  @Delete(':courseId')
  @ApiOperation({ summary: 'Delete course' })
  @ApiParam({ name: 'courseId', format: 'uuid' })
  @ApiOkResponse({ description: 'Course deleted successfully' })
  deleteCourse(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.coursesService.deleteCourse(courseId);
  }
}
