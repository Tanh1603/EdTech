import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserPayload } from '../../../common/types/current-user.type';
import { RecommendationQueryDto } from './dto/recommendation-query.dto';
import { RecommendationsService } from './recommendations.service';

@ApiTags('Learning - Recommendations')
@ApiBearerAuth()
@Controller('learning/recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get AI recommendations' })
  @ApiQuery({ name: 'classId', required: false, format: 'uuid' })
  @ApiOkResponse({ description: 'Recommendations returned successfully' })
  getRecommendations(
    @Query() query: RecommendationQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.recommendationsService.getRecommendations(query, user.id);
  }

  @Get('lessons')
  @ApiOperation({ summary: 'Get recommended lessons' })
  @ApiQuery({ name: 'classId', required: false, format: 'uuid' })
  @ApiOkResponse({ description: 'Recommended lessons returned successfully' })
  getRecommendedLessons(@Query() query: RecommendationQueryDto) {
    return this.recommendationsService.getRecommendedLessons(query);
  }

  @Get('materials')
  @ApiOperation({ summary: 'Get recommended materials' })
  @ApiQuery({ name: 'classId', required: false, format: 'uuid' })
  @ApiOkResponse({ description: 'Recommended materials returned successfully' })
  getRecommendedMaterials(@Query() query: RecommendationQueryDto) {
    return this.recommendationsService.getRecommendedMaterials(query);
  }

  @Get('topics')
  @ApiOperation({ summary: 'Get weak topics analysis' })
  @ApiQuery({ name: 'classId', required: false, format: 'uuid' })
  @ApiOkResponse({ description: 'Weak topics returned successfully' })
  getWeakTopics(
    @Query() query: RecommendationQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.recommendationsService.getWeakTopics(query, user.id);
  }

  @Get('next-learning')
  @ApiOperation({ summary: 'Get recommended next learning action' })
  @ApiQuery({ name: 'classId', required: false, format: 'uuid' })
  @ApiOkResponse({ description: 'Next learning action returned successfully' })
  getNextLearning(
    @Query() query: RecommendationQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.recommendationsService.getNextLearning(query, user.id);
  }
}
