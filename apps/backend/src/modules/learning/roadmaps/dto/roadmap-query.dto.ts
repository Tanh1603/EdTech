import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { RoadmapStatus } from '../../../../generated/prisma/client';

export class RoadmapQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: RoadmapStatus })
  @IsOptional()
  @IsEnum(RoadmapStatus)
  status?: RoadmapStatus;
}
