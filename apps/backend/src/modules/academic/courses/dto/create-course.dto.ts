import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'teacher_123' })
  @IsString()
  teacherId!: string;

  @ApiProperty({ example: 'Mathematics Grade 12', minLength: 2 })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: 'Advanced calculus course' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/math.png' })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;
}
