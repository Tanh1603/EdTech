import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../common';

export class ExamsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({ example: 'published' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'midterm' })
  @IsOptional()
  @IsString()
  search?: string;
}
