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
import {
  CourseQueryDto,
  CreateCourseDto,
  unwrapObjectResponse,
  unwrapPageResponse,
  UpdateCourseDto,
} from '@edtech/contracts';
import { GrpcMetadataBuilder } from '../common/grpc-metadata/grpc-metadata.builder';
import { RequestWithContext } from '../common/types/request-with-context';
import { BeCoreGrpcClientService } from '../grpc-clients/be-core-grpc-client.service';

@ApiTags('Academic - Courses')
@ApiBearerAuth()
@Controller('courses')
export class CoursesGatewayController {
  constructor(
    private readonly grpc: BeCoreGrpcClientService,
    private readonly metadataBuilder: GrpcMetadataBuilder,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get courses' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'math' })
  @ApiQuery({ name: 'teacherId', required: false, type: String })
  @ApiOkResponse({ description: 'Courses returned successfully' })
  async getCourses(@Query() query: CourseQueryDto, @Req() req: RequestWithContext) {
    return unwrapPageResponse(await lastValueFrom(
      this.grpc.courses.getCourses(
        {
          page: Number(query.page) || undefined,
          limit: Number(query.limit) || undefined,
          search: query.search,
          teacherId: query.teacherId,
        },
        this.metadataBuilder.build(req),
      ),
    ));
  }

  @Post()
  @ApiOperation({ summary: 'Create course' })
  @ApiBody({ type: CreateCourseDto })
  @ApiCreatedResponse({ description: 'Course created successfully' })
  async createCourse(@Body() body: CreateCourseDto, @Req() req: RequestWithContext) {
    return unwrapObjectResponse(await lastValueFrom(
      this.grpc.courses.createCourse(
        {
          teacherId: body.teacherId,
          name: body.name,
          description: body.description,
          thumbnailUrl: body.thumbnailUrl,
        },
        this.metadataBuilder.build(req),
      ),
    ));
  }

  @Get(':courseId')
  @ApiOperation({ summary: 'Get course detail' })
  @ApiParam({ name: 'courseId', format: 'uuid' })
  @ApiOkResponse({ description: 'Course detail returned successfully' })
  async getCourseDetail(
    @Param('courseId') courseId: string,
    @Req() req: RequestWithContext,
  ) {
    return unwrapObjectResponse(await lastValueFrom(
      this.grpc.courses.getCourseDetail(
        { courseId },
        this.metadataBuilder.build(req),
      ),
    ));
  }

  @Patch(':courseId')
  @ApiOperation({ summary: 'Update course' })
  @ApiParam({ name: 'courseId', format: 'uuid' })
  @ApiBody({ type: UpdateCourseDto })
  @ApiOkResponse({ description: 'Course updated successfully' })
  async updateCourse(
    @Param('courseId') courseId: string,
    @Body() body: UpdateCourseDto,
    @Req() req: RequestWithContext,
  ) {
    return unwrapObjectResponse(await lastValueFrom(
      this.grpc.courses.updateCourse(
        {
          courseId,
          name: body.name,
          description: body.description,
          thumbnailUrl: body.thumbnailUrl,
        },
        this.metadataBuilder.build(req),
      ),
    ));
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
      this.grpc.courses.deleteCourse(
        { courseId },
        this.metadataBuilder.build(req),
      ),
    );
  }
}
