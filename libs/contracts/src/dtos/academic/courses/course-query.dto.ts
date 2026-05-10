import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common';

export class CourseQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'math' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'teacher_123' })
  @IsOptional()
  @IsString()
  teacherId?: string;
}
