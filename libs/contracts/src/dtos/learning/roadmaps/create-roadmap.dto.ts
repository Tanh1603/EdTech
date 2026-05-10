import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateRoadmapDto {
  @ApiProperty({ example: 'Frontend roadmap', minLength: 2 })
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiPropertyOptional({ example: 'Become React developer' })
  @IsOptional()
  @IsString()
  targetGoal?: string;
}
