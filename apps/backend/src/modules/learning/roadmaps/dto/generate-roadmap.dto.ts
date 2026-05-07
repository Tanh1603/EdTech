import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class GenerateRoadmapDto {
  @ApiProperty({ example: 'Master Calculus' })
  @IsString()
  targetGoal!: string;

  @ApiPropertyOptional({ example: ['Derivative', 'Integral'], type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  weakTopics?: string[];

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  classId?: string;
}
