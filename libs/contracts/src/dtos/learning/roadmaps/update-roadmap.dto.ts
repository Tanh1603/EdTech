import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { RoadmapStatus } from '../../common';

export class UpdateRoadmapDto {
  @ApiPropertyOptional({ example: 'Updated roadmap', minLength: 2 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @ApiPropertyOptional({ example: 'Master advanced topics' })
  @IsOptional()
  @IsString()
  targetGoal?: string;

  @ApiPropertyOptional({ enum: RoadmapStatus, example: RoadmapStatus.paused })
  @IsOptional()
  @IsEnum(RoadmapStatus)
  status?: RoadmapStatus;
}
