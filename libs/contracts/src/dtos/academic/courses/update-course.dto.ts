import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class UpdateCourseDto {
  @ApiPropertyOptional({ example: 'Mathematics Updated', minLength: 2 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated course' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/math-updated.png' })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;
}
