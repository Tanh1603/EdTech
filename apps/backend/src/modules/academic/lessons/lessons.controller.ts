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
import { PaginationQueryDto } from '@edtech/contracts';
import { ClassroomLessonsQueryDto } from '@edtech/contracts';
import { CreateLessonDto } from '@edtech/contracts';
import { PublishClassroomLessonDto } from '@edtech/contracts';
import { UpdateClassroomLessonDto } from '@edtech/contracts';
import { UpdateLessonDto } from '@edtech/contracts';
import { LessonsService } from './lessons.service';

@ApiTags('Academic - Lessons')
@ApiBearerAuth()
@Controller()
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post('lessons')
  @ApiOperation({ summary: 'Create lesson' })
  @ApiBody({ type: CreateLessonDto })
  @ApiCreatedResponse({ description: 'Lesson created successfully' })
  createLesson(@Body() body: CreateLessonDto) {
    return this.lessonsService.createLesson(body);
  }

  @Get('courses/:courseId/lessons')
  @ApiOperation({ summary: 'Get lessons by course' })
  @ApiParam({ name: 'courseId', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiOkResponse({ description: 'Course lessons returned successfully' })
  getLessonsByCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.lessonsService.getLessonsByCourse(courseId, query);
  }

  @Get('lessons/:lessonId')
  @ApiOperation({ summary: 'Get lesson detail' })
  @ApiParam({ name: 'lessonId', format: 'uuid' })
  @ApiOkResponse({ description: 'Lesson detail returned successfully' })
  getLessonDetail(@Param('lessonId', ParseUUIDPipe) lessonId: string) {
    return this.lessonsService.getLessonDetail(lessonId);
  }

  @Patch('lessons/:lessonId')
  @ApiOperation({ summary: 'Update lesson' })
  @ApiParam({ name: 'lessonId', format: 'uuid' })
  @ApiBody({ type: UpdateLessonDto })
  @ApiOkResponse({ description: 'Lesson updated successfully' })
  updateLesson(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() body: UpdateLessonDto,
  ) {
    return this.lessonsService.updateLesson(lessonId, body);
  }

  @Delete('lessons/:lessonId')
  @ApiOperation({ summary: 'Delete lesson' })
  @ApiParam({ name: 'lessonId', format: 'uuid' })
  @ApiOkResponse({ description: 'Lesson deleted successfully' })
  deleteLesson(@Param('lessonId', ParseUUIDPipe) lessonId: string) {
    return this.lessonsService.deleteLesson(lessonId);
  }

  @Post('classes/:classroomId/lessons')
  @ApiOperation({ summary: 'Publish lesson to classroom' })
  @ApiParam({ name: 'classroomId', format: 'uuid' })
  @ApiBody({ type: PublishClassroomLessonDto })
  @ApiCreatedResponse({ description: 'Lesson published successfully' })
  publishLessonToClassroom(
    @Param('classroomId', ParseUUIDPipe) classroomId: string,
    @Body() body: PublishClassroomLessonDto,
  ) {
    return this.lessonsService.publishLessonToClassroom(classroomId, body);
  }

  @Get('classes/:classroomId/lessons')
  @ApiOperation({ summary: 'Get classroom lessons' })
  @ApiParam({ name: 'classroomId', format: 'uuid' })
  @ApiQuery({
    name: 'publishedOnly',
    required: false,
    type: Boolean,
    example: true,
  })
  @ApiOkResponse({ description: 'Classroom lessons returned successfully' })
  getClassroomLessons(
    @Param('classroomId', ParseUUIDPipe) classroomId: string,
    @Query() query: ClassroomLessonsQueryDto,
  ) {
    return this.lessonsService.getClassroomLessons(classroomId, query);
  }

  @Patch('classes/:classroomId/lessons/:lessonId')
  @ApiOperation({ summary: 'Update classroom lesson publishing state' })
  @ApiParam({ name: 'classroomId', format: 'uuid' })
  @ApiParam({ name: 'lessonId', format: 'uuid' })
  @ApiBody({ type: UpdateClassroomLessonDto })
  @ApiOkResponse({ description: 'Classroom lesson updated successfully' })
  updateClassroomLesson(
    @Param('classroomId', ParseUUIDPipe) classroomId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() body: UpdateClassroomLessonDto,
  ) {
    return this.lessonsService.updateClassroomLesson(
      classroomId,
      lessonId,
      body,
    );
  }

  @Delete('classes/:classroomId/lessons/:lessonId')
  @ApiOperation({ summary: 'Remove lesson from classroom' })
  @ApiParam({ name: 'classroomId', format: 'uuid' })
  @ApiParam({ name: 'lessonId', format: 'uuid' })
  @ApiOkResponse({ description: 'Classroom lesson removed successfully' })
  removeLessonFromClassroom(
    @Param('classroomId', ParseUUIDPipe) classroomId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    return this.lessonsService.removeLessonFromClassroom(classroomId, lessonId);
  }
}
