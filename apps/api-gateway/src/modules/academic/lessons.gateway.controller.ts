import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
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
import { lastValueFrom } from 'rxjs';
import { GrpcMetadataBuilder } from '../common/grpc-metadata/grpc-metadata.builder';
import { RequestWithContext } from '../common/types/request-with-context';
import { AcademicGrpcClientService } from '../grpc-clients/academic-grpc-client.service';

@ApiTags('Academic - Lessons')
@ApiBearerAuth()
@Controller()
export class LessonsGatewayController {
  constructor(
    private readonly academicGrpc: AcademicGrpcClientService,
    private readonly metadataBuilder: GrpcMetadataBuilder,
  ) {}

  @Post('lessons')
  @ApiOperation({ summary: 'Create lesson' })
  @ApiBody({ schema: { type: 'object' } })
  @ApiCreatedResponse({ description: 'Lesson created successfully' })
  createLesson(@Body() body: any, @Req() req: RequestWithContext) {
    return lastValueFrom(
      this.academicGrpc.lessons.createLesson(
        {
          courseId: body.courseId,
          title: body.title,
          description: body.description,
          orderNo: body.orderNo,
        },
        this.metadataBuilder.build(req),
      ),
    );
  }

  @Get('courses/:courseId/lessons')
  @ApiOperation({ summary: 'Get lessons by course' })
  @ApiParam({ name: 'courseId', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiOkResponse({ description: 'Course lessons returned successfully' })
  getLessonsByCourse(
    @Param('courseId') courseId: string,
    @Query() query: any,
    @Req() req: RequestWithContext,
  ) {
    return lastValueFrom(
      this.academicGrpc.lessons.getLessonsByCourse(
        {
          courseId,
          page: Number(query.page) || undefined,
          limit: Number(query.limit) || undefined,
        },
        this.metadataBuilder.build(req),
      ),
    );
  }

  @Get('lessons/:lessonId')
  @ApiOperation({ summary: 'Get lesson detail' })
  @ApiParam({ name: 'lessonId', format: 'uuid' })
  @ApiOkResponse({ description: 'Lesson detail returned successfully' })
  getLessonDetail(
    @Param('lessonId') lessonId: string,
    @Req() req: RequestWithContext,
  ) {
    return lastValueFrom(
      this.academicGrpc.lessons.getLessonDetail(
        { lessonId },
        this.metadataBuilder.build(req),
      ),
    );
  }

  @Patch('lessons/:lessonId')
  @ApiOperation({ summary: 'Update lesson' })
  @ApiParam({ name: 'lessonId', format: 'uuid' })
  @ApiBody({ schema: { type: 'object' } })
  @ApiOkResponse({ description: 'Lesson updated successfully' })
  updateLesson(
    @Param('lessonId') lessonId: string,
    @Body() body: any,
    @Req() req: RequestWithContext,
  ) {
    return lastValueFrom(
      this.academicGrpc.lessons.updateLesson(
        {
          lessonId,
          title: body.title,
          description: body.description,
          orderNo: body.orderNo,
        },
        this.metadataBuilder.build(req),
      ),
    );
  }

  @Delete('lessons/:lessonId')
  @ApiOperation({ summary: 'Delete lesson' })
  @ApiParam({ name: 'lessonId', format: 'uuid' })
  @ApiOkResponse({ description: 'Lesson deleted successfully' })
  deleteLesson(
    @Param('lessonId') lessonId: string,
    @Req() req: RequestWithContext,
  ) {
    return lastValueFrom(
      this.academicGrpc.lessons.deleteLesson(
        { lessonId },
        this.metadataBuilder.build(req),
      ),
    );
  }

  @Post('classes/:classroomId/lessons')
  @ApiOperation({ summary: 'Publish lesson to classroom' })
  @ApiParam({ name: 'classroomId', format: 'uuid' })
  @ApiBody({ schema: { type: 'object' } })
  @ApiCreatedResponse({ description: 'Lesson published successfully' })
  publishLessonToClassroom(
    @Param('classroomId') classroomId: string,
    @Body() body: any,
    @Req() req: RequestWithContext,
  ) {
    return lastValueFrom(
      this.academicGrpc.lessons.publishLessonToClassroom(
        {
          classroomId,
          lessonId: body.lessonId,
          isPublished: body.isPublished,
        },
        this.metadataBuilder.build(req),
      ),
    );
  }

  @Get('classes/:classroomId/lessons')
  @ApiOperation({ summary: 'Get classroom lessons' })
  @ApiParam({ name: 'classroomId', format: 'uuid' })
  @ApiQuery({ name: 'publishedOnly', required: false, type: Boolean })
  @ApiOkResponse({ description: 'Classroom lessons returned successfully' })
  async getClassroomLessons(
    @Param('classroomId') classroomId: string,
    @Query() query: any,
    @Req() req: RequestWithContext,
  ) {
    const response = await lastValueFrom(
      this.academicGrpc.lessons.getClassroomLessons(
        { classroomId, publishedOnly: query.publishedOnly === 'true' },
        this.metadataBuilder.build(req),
      ),
    );
    return response.items ?? [];
  }

  @Patch('classes/:classroomId/lessons/:lessonId')
  @ApiOperation({ summary: 'Update classroom lesson publishing state' })
  @ApiParam({ name: 'classroomId', format: 'uuid' })
  @ApiParam({ name: 'lessonId', format: 'uuid' })
  @ApiBody({ schema: { type: 'object' } })
  @ApiOkResponse({ description: 'Classroom lesson updated successfully' })
  updateClassroomLesson(
    @Param('classroomId') classroomId: string,
    @Param('lessonId') lessonId: string,
    @Body() body: any,
    @Req() req: RequestWithContext,
  ) {
    return lastValueFrom(
      this.academicGrpc.lessons.updateClassroomLesson(
        { classroomId, lessonId, isPublished: body.isPublished },
        this.metadataBuilder.build(req),
      ),
    );
  }

  @Delete('classes/:classroomId/lessons/:lessonId')
  @ApiOperation({ summary: 'Remove lesson from classroom' })
  @ApiParam({ name: 'classroomId', format: 'uuid' })
  @ApiParam({ name: 'lessonId', format: 'uuid' })
  @ApiOkResponse({ description: 'Classroom lesson removed successfully' })
  removeLessonFromClassroom(
    @Param('classroomId') classroomId: string,
    @Param('lessonId') lessonId: string,
    @Req() req: RequestWithContext,
  ) {
    return lastValueFrom(
      this.academicGrpc.lessons.removeLessonFromClassroom(
        { classroomId, lessonId },
        this.metadataBuilder.build(req),
      ),
    );
  }
}
