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
import { CourseQueryDto, CreateCourseDto, UpdateCourseDto } from '@edtech/contracts';
import { GrpcMetadataBuilder } from '../common/grpc-metadata/grpc-metadata.builder';
import { RequestWithContext } from '../common/types/request-with-context';
import { AcademicGrpcClientService } from '../grpc-clients/academic-grpc-client.service';

@ApiTags('Academic - Courses')
@ApiBearerAuth()
@Controller('courses')
export class CoursesGatewayController {
  constructor(
    private readonly academicGrpc: AcademicGrpcClientService,
    private readonly metadataBuilder: GrpcMetadataBuilder,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get courses' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'math' })
  @ApiQuery({ name: 'teacherId', required: false, type: String })
  @ApiOkResponse({ description: 'Courses returned successfully' })
  getCourses(@Query() query: CourseQueryDto, @Req() req: RequestWithContext) {
    return lastValueFrom(
      this.academicGrpc.courses.getCourses(
        {
          page: Number(query.page) || undefined,
          limit: Number(query.limit) || undefined,
          search: query.search,
          teacherId: query.teacherId,
        },
        this.metadataBuilder.build(req),
      ),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create course' })
  @ApiBody({ schema: { type: 'object' } })
  @ApiCreatedResponse({ description: 'Course created successfully' })
  createCourse(@Body() body: CreateCourseDto, @Req() req: RequestWithContext) {
    return lastValueFrom(
      this.academicGrpc.courses.createCourse(
        {
          teacherId: body.teacherId,
          name: body.name,
          description: body.description,
          thumbnailUrl: body.thumbnailUrl,
        },
        this.metadataBuilder.build(req),
      ),
    );
  }

  @Get(':courseId')
  @ApiOperation({ summary: 'Get course detail' })
  @ApiParam({ name: 'courseId', format: 'uuid' })
  @ApiOkResponse({ description: 'Course detail returned successfully' })
  getCourseDetail(
    @Param('courseId') courseId: string,
    @Req() req: RequestWithContext,
  ) {
    return lastValueFrom(
      this.academicGrpc.courses.getCourseDetail(
        { courseId },
        this.metadataBuilder.build(req),
      ),
    );
  }

  @Patch(':courseId')
  @ApiOperation({ summary: 'Update course' })
  @ApiParam({ name: 'courseId', format: 'uuid' })
  @ApiBody({ schema: { type: 'object' } })
  @ApiOkResponse({ description: 'Course updated successfully' })
  updateCourse(
    @Param('courseId') courseId: string,
    @Body() body: CreateCourseDto,
    @Req() req: RequestWithContext,
  ) {
    return lastValueFrom(
      this.academicGrpc.courses.updateCourse(
        {
          courseId,
          name: body.name,
          description: body.description,
          thumbnailUrl: body.thumbnailUrl,
        },
        this.metadataBuilder.build(req),
      ),
    );
  }

  @Delete(':courseId')
  @ApiOperation({ summary: 'Delete course' })
  @ApiParam({ name: 'courseId', format: 'uuid' })
  @ApiOkResponse({ description: 'Course deleted successfully' })
  deleteCourse(
    @Param('courseId') courseId: string,
    @Req() req: RequestWithContext,
  ) {
    return lastValueFrom(
      this.academicGrpc.courses.deleteCourse(
        { courseId },
        this.metadataBuilder.build(req),
      ),
    );
  }
}
