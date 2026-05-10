import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto, RoadmapStatus } from '../../common';

export class RoadmapQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: RoadmapStatus })
  @IsOptional()
  @IsEnum(RoadmapStatus)
  status?: RoadmapStatus;
}
