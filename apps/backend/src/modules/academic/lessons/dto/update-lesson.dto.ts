import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateLessonDto {
  @ApiPropertyOptional({ example: 'Updated Lesson', minLength: 2 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @ApiPropertyOptional({ example: 'Updated content' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 2, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  orderNo?: number;
}
