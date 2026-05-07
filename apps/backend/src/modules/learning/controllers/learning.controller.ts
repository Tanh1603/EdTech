import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { PlacementTestDto } from '../dto/placement-test.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { LearningService } from '../services/learning.service';

@Controller()
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  @Get('documents')
  getDocuments(@Query() query: PaginationQueryDto) {
    return this.learningService.getDocuments(
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Post('documents')
  createDocument(@Body() body: CreateDocumentDto) {
    return this.learningService.createDocument(body);
  }

  @Put('documents/:documentId')
  updateDocument(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() body: UpdateDocumentDto,
  ) {
    return this.learningService.updateDocument(documentId, body);
  }

  @Delete('documents/:documentId')
  async deleteDocument(
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ): Promise<void> {
    await this.learningService.deleteDocument(documentId);
  }

  @Post('placement-tests')
  submitPlacementTest(@Body() body: PlacementTestDto) {
    return this.learningService.submitPlacementTest(body);
  }

  @Get('learning/roadmap')
  getRoadmap() {
    return this.learningService.getRoadmap();
  }

  @Get('learning/progress')
  getProgress() {
    return this.learningService.getProgress();
  }
}
